(function () {
  const BASE = '';

  let configCache = null;
  let configPromise = null;

  function getConfig() {
    if (configCache) return Promise.resolve(configCache);
    if (!configPromise) {
      configPromise = fetch(`${BASE}/api/public/maps-config`, { credentials: 'same-origin' })
        .then((r) => (r.ok ? r.json() : {}))
        .then((c) => {
          configCache = {
            provider: c.provider === 'yandex' ? 'yandex' : 'osm',
            yandexMapsKey: c.yandexMapsKey || null,
          };
          return configCache;
        })
        .catch(() => {
          configCache = { provider: 'osm', yandexMapsKey: null };
          return configCache;
        });
    }
    return configPromise;
  }

  /** Параллельная подгрузка конфигурации и скриптов карты после загрузки страницы оператора или корзины. */
  function prefetch() {
    void getConfig();
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
      const existing = document.querySelector('script[data-leaflet-js="true"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.L));
        existing.addEventListener('error', () => reject(new Error('leaflet_load_error')));
        return;
      }
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.setAttribute('data-leaflet-js', 'true');
      s.onload = () => resolve(window.L);
      s.onerror = () => reject(new Error('leaflet_load_error'));
      document.head.appendChild(s);
    });
    return leafletPromise;
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
        const s = document.createElement('script');
        s.async = true;
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
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);
        return { engine: 'leaflet', map };
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
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);
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

        return {
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
        };
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
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '',
        }).addTo(map);

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
        return {
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
        };
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
})();
