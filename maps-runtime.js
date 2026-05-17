(function () {
  const BASE = '';

  let configCache = null;
  let configPromise = null;

  function getConfig() {
    if (configCache) return Promise.resolve(configCache);
    if (!configPromise) {
      configPromise = fetch(`${BASE}/api/public/maps-config`, {
        credentials: 'same-origin',
        cache: 'no-store',
      })
        .then((r) => (r.ok ? r.json() : {}))
        .then((c) => {
          let subs = c.leafletSubdomains;
          if (!Array.isArray(subs)) {
            subs =
              typeof subs === 'string'
                ? subs.split(',').map((x) => x.trim()).filter(Boolean)
                : ['a', 'b', 'c'];
          }
          if (!subs.length) subs = ['a', 'b', 'c'];
          const tileUrl = typeof c.leafletTileUrl === 'string' ? c.leafletTileUrl.trim() : '';
          configCache = {
            provider: c.provider === 'yandex' ? 'yandex' : 'osm',
            yandexMapsKey: c.yandexMapsKey || null,
            leafletTileUrl: tileUrl || null,
            leafletAttribution: typeof c.leafletAttribution === 'string' ? c.leafletAttribution : '',
            leafletSubdomains: subs,
          };
          return configCache;
        })
        .catch(() => {
          configCache = {
            provider: 'osm',
            yandexMapsKey: null,
            leafletTileUrl: null,
            leafletAttribution: '',
            leafletSubdomains: ['a', 'b', 'c'],
          };
          return configCache;
        });
    }
    return configPromise;
  }

  /**
   * Параллельная подгрузка: конфиг + сразу движок (Яндекс при наличии ключа или Leaflet).
   * Вызывать пораньше со страниц с maps-runtime.js — окно загрузки окажется общим с действиями пользователя.
   */
  function prefetch() {
    void getConfig()
      .then((c) => {
        if (c?.yandexMapsKey) return loadYmaps().catch(() => null);
        return loadLeaflet().catch(() => null);
      })
      .catch(() => {});
  }

  /** Не дергаем CDN карт без потребности (меньше лишней загрузки на community/contacts и т.д.). */
  function documentLikelyUsesMaps() {
    try {
      const raw = typeof location !== 'undefined' ? String(location.pathname || '') : '';
      const path = raw.replace(/\\/g, '/');
      const leaf = path.split('/').filter(Boolean).pop() || '';
      if (/^(operator|delivery|catalog)\.html$/i.test(leaf)) return true;
      if (document.getElementById('deliveryLeafletMap')) return true;
      if (document.getElementById('checkoutMapRoot')) return true;
      if (document.body?.classList?.contains?.('catalog-page')) return true;
    } catch {
      /**/
    }
    return false;
  }

  let leafletPromise = null;
  function loadLeaflet() {
    if (typeof window !== 'undefined' && window.L) return Promise.resolve(window.L);
    if (leafletPromise) return leafletPromise;
    leafletPromise = new Promise((resolve, reject) => {
      const cssExists = document.querySelector('link[data-leaflet-css="true"]');
      if (!cssExists) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.setAttribute('data-leaflet-css', 'true');
        document.head.appendChild(link);
      }
      const resolveL = () => {
        if (window.L) resolve(window.L);
        else reject(new Error('leaflet_load_error'));
      };
      const existing = document.querySelector('script[data-leaflet-js="true"]');
      if (existing instanceof HTMLScriptElement) {
        if (window.L) {
          resolve(window.L);
          return;
        }
        if (existing.dataset.ekLeafletLoaded === '1') {
          resolveL();
          return;
        }
        existing.addEventListener(
          'load',
          () => {
            existing.dataset.ekLeafletLoaded = '1';
            resolveL();
          },
          { once: true }
        );
        existing.addEventListener(
          'error',
          () => reject(new Error('leaflet_load_error')),
          { once: true }
        );
        queueMicrotask(() => {
          if (window.L && existing.dataset.ekLeafletLoaded !== '1') {
            existing.dataset.ekLeafletLoaded = '1';
            resolve(window.L);
          }
        });
        return;
      }
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.setAttribute('data-leaflet-js', 'true');
      s.onload = () => {
        s.dataset.ekLeafletLoaded = '1';
        resolveL();
      };
      s.onerror = () => reject(new Error('leaflet_load_error'));
      document.head.appendChild(s);
    });
    return leafletPromise;
  }

  /**
   * Подложка: свои XYZ из /api/public/maps-config (LEAFLET_TILE_URL) или OSM по умолчанию.
   * @param {boolean} attributionVisible — для клиента показывать подпись; у оператора можно скрыть как раньше.
   */
  function addLeafletRasterLayer(L, map, attributionVisible) {
    return getConfig().then((cfg) => {
      const useOwn = Boolean(cfg.leafletTileUrl);
      const url = useOwn
        ? cfg.leafletTileUrl
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      let attribution = '';
      if (useOwn) attribution = String(cfg.leafletAttribution || '');
      else if (attributionVisible) attribution = '&copy; OpenStreetMap';
      const layerOpts = { maxZoom: 19, attribution };
      if (/\{s\}/.test(url)) {
        layerOpts.subdomains =
          Array.isArray(cfg.leafletSubdomains) && cfg.leafletSubdomains.length
            ? cfg.leafletSubdomains
            : ['a', 'b', 'c'];
      }
      L.tileLayer(url, layerOpts).addTo(map);
    });
  }

  let ymapsPromise = null;
  function loadYmaps() {
    if (typeof window !== 'undefined' && window.ymaps && window.ymaps.Map) {
      return new Promise((resolve) => window.ymaps.ready(() => resolve(window.ymaps)));
    }
    if (ymapsPromise) return ymapsPromise;
    ymapsPromise = getConfig().then((c) => {
      if (!c?.yandexMapsKey) return null;
      return new Promise((resolve, reject) => {
        if (window.ymaps && window.ymaps.Map) {
          window.ymaps.ready(() => resolve(window.ymaps));
          return;
        }
        const existing = document.querySelector('script[data-ek-ymaps-api="true"]');
        if (existing instanceof HTMLScriptElement) {
          const done = () => {
            window.ymaps.ready(() => resolve(window.ymaps));
          };
          existing.addEventListener(
            'load',
            () => done(),
            { once: true }
          );
          existing.addEventListener(
            'error',
            () => reject(new Error('ymaps_load_error')),
            { once: true }
          );
          queueMicrotask(() => {
            if (window.ymaps && window.ymaps.Map) done();
          });
          return;
        }
        const s = document.createElement('script');
        s.async = true;
        s.setAttribute('data-ek-ymaps-api', 'true');
        s.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(c.yandexMapsKey)}&lang=ru_RU`;
        s.onload = () => {
          window.ymaps.ready(() => resolve(window.ymaps));
        };
        s.onerror = () => reject(new Error('ymaps_load_error'));
        document.head.appendChild(s);
      });
    });
    return ymapsPromise;
  }

  /** Демо-карта / зона доставки: только просмотр. */
  function initStaticMap(container, centerLatLng, zoom) {
    if (!(container instanceof HTMLElement)) return Promise.resolve(null);
    return loadYmaps().then((ymaps) => {
      if (ymaps) {
        const map = new ymaps.Map(container, {
          center: centerLatLng,
          zoom,
          controls: ['zoomControl'],
        });
        map.behaviors.disable('scrollZoom');
        return { engine: 'yandex', map };
      }
      return loadLeaflet().then((L) => {
        const map = L.map(container, { zoomControl: true, scrollWheelZoom: true }).setView(centerLatLng, zoom);
        return addLeafletRasterLayer(L, map, true).then(() => ({ engine: 'leaflet', map }));
      });
    });
  }

  /**
   * Карта с маркером и кликом по карте (корзина / карта клиента).
   * @returns {Promise<{ engine: string, invalidateSize: Function, flyToMarker: Function, destroy: Function }>}
   */
  function attachInteractiveMap(container, centerLatLng, zoom, handlers) {
    const onMapClick =
      handlers && typeof handlers.onMapClick === 'function'
        ? handlers.onMapClick
        : () => {};

    return loadYmaps().then((ymaps) => {
      if (ymaps) {
        container.innerHTML = '';
        const map = new ymaps.Map(container, {
          center: centerLatLng,
          zoom,
          controls: ['zoomControl'],
        });
        map.behaviors.disable('scrollZoom');
        let placemark = null;

        function setMarker(lat, lon) {
          const coords = [lat, lon];
          if (!placemark) {
            placemark = new ymaps.Placemark(
              coords,
              {},
              { draggable: false, preset: 'islands#blueIcon' }
            );
            map.geoObjects.add(placemark);
          } else {
            placemark.geometry.setCoordinates(coords);
          }
        }

        map.events.add('click', (e) => {
          const c = e.get('coords');
          setMarker(c[0], c[1]);
          onMapClick(c[0], c[1]);
        });

        function flyTo(lat, lon, z) {
          map.setCenter([lat, lon], z == null ? map.getZoom() : z, { duration: 200 });
        }

        function invalidateSize() {
          try {
            map.container.fitToViewport();
          } catch (_) {
            /**/
          }
        }

        function clearMarker() {
          if (placemark) {
            map.geoObjects.remove(placemark);
            placemark = null;
          }
        }

        return {
          engine: 'yandex',
          map,
          setMarker,
          clearMarker,
          flyToMarker: flyTo,
          invalidateSize,
          destroy() {
            try {
              map.destroy();
            } catch (_) {
              /**/
            }
          },
        };
      }

      return loadLeaflet().then((L) => {
        container.innerHTML = '';
        const map = L.map(container).setView(centerLatLng, zoom);
        let marker = null;

        function setMarker(lat, lon) {
          if (!marker) marker = L.marker([lat, lon]).addTo(map);
          else marker.setLatLng([lat, lon]);
        }

        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          setMarker(lat, lng);
          onMapClick(lat, lng);
        });

        function flyTo(lat, lon, zLevel) {
          map.setView([lat, lon], zLevel != null ? zLevel : map.getZoom());
        }

        function clearMarker() {
          if (marker) {
            map.removeLayer(marker);
            marker = null;
          }
        }

        return addLeafletRasterLayer(L, map, true).then(() => ({
          engine: 'leaflet',
          map,
          leafLet: L,
          setMarker,
          clearMarker,
          flyToMarker: flyTo,
          invalidateSize: () => map.invalidateSize(),
          destroy() {
            try {
              map.remove();
            } catch (_) {
              /**/
            }
          },
        }));
      });
    });
  }

  /**
   * Зона заказов: слой маркеров + всплывающее окно.
   */
  function attachOrdersLayer(engine, hostMap, onPopupActionClose) {
    const closer = typeof onPopupActionClose === 'function' ? onPopupActionClose : () => {};

    if (engine === 'yandex' && hostMap && window.ymaps) {
      const collection = new window.ymaps.GeoObjectCollection();
      hostMap.geoObjects.add(collection);
      return {
        engine: 'yandex',
        layer: collection,
        clear() {
          collection.removeAll();
        },
        addOrderMarker(lat, lng, ringColor, balloonHtml, orderIdTag) {
          const pm = new window.ymaps.Placemark(
            [lat, lng],
            {
              balloonContent: balloonHtml,
              hintContent: String(orderIdTag || ''),
            },
            {
              preset: 'islands#circleDotIcon',
              iconColor: ringColor,
            }
          );
          collection.add(pm);
          return pm;
        },
        closePopup() {
          try {
            hostMap.balloon.close();
          } catch (_) {
            /**/
          }
        },
      };
    }

    const L = window.L;
    if (!hostMap || !L) return null;
    const layer = L.layerGroup().addTo(hostMap);
    return {
      engine: 'leaflet',
      layer,
      leafMap: hostMap,
      clear() {
        layer.clearLayers();
      },
      addOrderMarker(lat, lng, ringColor, popupHtml /* eslint-disable-line no-unused-vars */) {
        const m = L.circleMarker([lat, lng], {
          radius: 14,
          color: ringColor,
          weight: 2,
          fillColor: '#ffffff',
          fillOpacity: 0.95,
        });
        m.bindPopup(popupHtml, {
          maxWidth: 280,
          className: 'opx-zone-leaflet-popup',
        });
        m.addTo(layer);
        return m;
      },
      closePopup() {
        closer();
      },
    };
  }

  function createOrdersMapHost(container, centerLatLng, zoom, popupRootHandler) {
    return loadYmaps().then((ymaps) => {
      if (ymaps) {
        container.innerHTML = '';
        const map = new ymaps.Map(container, {
          center: centerLatLng,
          zoom,
          controls: ['zoomControl'],
        });
        map.behaviors.disable('scrollZoom');

        function closePopupFn() {
          try {
            map.balloon.close();
          } catch (_) {
            /**/
          }
        }

        const containerEl = map.container.getElement();
        if (containerEl instanceof HTMLElement && !map._ekvalinePopupNav) {
          map._ekvalinePopupNav = true;
          containerEl.addEventListener('click', (event) => {
            const btOrder = event.target.closest('[data-opx-zone-open-order]');
            if (btOrder && containerEl.contains(btOrder)) {
              event.preventDefault();
              event.stopPropagation();
              closePopupFn();
              if (popupRootHandler) popupRootHandler({ type: 'order', btn: btOrder });
              return;
            }
            const btn = event.target.closest('[data-opx-zone-open-client]');
            if (btn && containerEl.contains(btn)) {
              event.preventDefault();
              event.stopPropagation();
              closePopupFn();
              if (popupRootHandler) popupRootHandler({ type: 'client', btn });
            }
          });
        }

        function invalidateZoneMapSize() {
          try {
            map.container.fitToViewport();
          } catch (_) {
            /**/
          }
        }

        const layerBundle = attachOrdersLayer('yandex', map, closePopupFn);
        return {
          engine: 'yandex',
          map,
          invalidateSize: invalidateZoneMapSize,
          ...layerBundle,
          destroy() {
            try {
              map.destroy();
            } catch (_) {
              /**/
            }
          },
        };
      }

      return loadLeaflet().then((L) => {
        container.innerHTML = '';
        const map = L.map(container, { zoomControl: true, attributionControl: false }).setView(centerLatLng, zoom);

        if (!map._opxPopupActionsBound && popupRootHandler) {
          map._opxPopupActionsBound = true;
          map.getContainer().addEventListener('click', (event) => {
            const btOrder = event.target.closest('[data-opx-zone-open-order]');
            if (btOrder && map.getContainer().contains(btOrder)) {
              event.preventDefault();
              event.stopPropagation();
              map.closePopup();
              popupRootHandler({ type: 'order', btn: btOrder });
              return;
            }
            const btn = event.target.closest('[data-opx-zone-open-client]');
            if (!(btn && map.getContainer().contains(btn))) return;
            event.preventDefault();
            event.stopPropagation();
            map.closePopup();
            popupRootHandler({ type: 'client', btn });
          });
        }

        const layerBundle = attachOrdersLayer('leaflet', map, () => map.closePopup());
        /** Оператор: без подписи для OSM как раньше; для своих тайлов — текст из LEAFLET_TILE_ATTRIBUTION (часто обязателен). */
        return addLeafletRasterLayer(L, map, false).then(() => ({
          engine: 'leaflet',
          map,
          invalidateSize: () => map.invalidateSize(),
          ...layerBundle,
          destroy() {
            try {
              map.remove();
            } catch (_) {
              /**/
            }
          },
        }));
      });
    });
  }

  window.EkvalineMaps = {
    prefetch,
    getConfig,
    loadLeaflet,
    loadYmaps,
    initStaticMap,
    attachInteractiveMap,
    createOrdersMapHost,
    /** Совместимость: для уточняющего кода оператора «есть ли Yandex». */
    async usesYandexTiles() {
      const c = await getConfig();
      return Boolean(c.yandexMapsKey);
    },
  };

  if (typeof document !== 'undefined') {
    const startMapsWarmup = () => {
      if (documentLikelyUsesMaps()) prefetch();
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startMapsWarmup, { once: true });
    } else {
      startMapsWarmup();
    }
  }
})();
