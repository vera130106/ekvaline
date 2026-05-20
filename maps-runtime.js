(function () {
  const BASE = '';
  const DEFAULT_CENTER = [51.7682, 55.0969];
  const MAP_UNAVAILABLE_MSG =
    'Карта недоступна: на сервере не задан ключ YANDEX_MAPS_API_KEY (JavaScript API и HTTP Геокодер).';

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
          const key = typeof c.yandexMapsKey === 'string' ? c.yandexMapsKey.trim() : '';
          configCache = {
            provider: key ? 'yandex' : 'none',
            yandexMapsKey: key || null,
          };
          return configCache;
        })
        .catch(() => {
          configCache = { provider: 'none', yandexMapsKey: null };
          return configCache;
        });
    }
    return configPromise;
  }

  function prefetch() {
    void getConfig()
      .then((c) => (c?.yandexMapsKey ? loadYmaps() : null))
      .catch(() => {});
  }

  function documentLikelyUsesMaps() {
    try {
      const raw = typeof location !== 'undefined' ? String(location.pathname || '') : '';
      const path = raw.replace(/\\/g, '/');
      const leaf = path.split('/').filter(Boolean).pop() || '';
      if (/^(operator|delivery|catalog)\.html$/i.test(leaf)) return true;
      if (document.getElementById('deliveryZoneMap')) return true;
      if (document.getElementById('checkoutMapRoot')) return true;
      if (document.body?.classList?.contains?.('catalog-page')) return true;
    } catch {
      /**/
    }
    return false;
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
          existing.addEventListener('load', () => done(), { once: true });
          existing.addEventListener('error', () => reject(new Error('ymaps_load_error')), { once: true });
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

  function renderMapPlaceholder(container, message) {
    if (!(container instanceof HTMLElement)) return null;
    container.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'ek-map-unavailable';
    box.setAttribute('role', 'status');
    box.textContent = String(message || MAP_UNAVAILABLE_MSG);
    container.appendChild(box);
    return {
      engine: 'none',
      map: null,
      setMarker() {},
      clearMarker() {},
      flyToMarker() {},
      invalidateSize() {},
      clear() {},
      addOrderMarker() {},
      closePopup() {},
      destroy() {
        container.innerHTML = '';
      },
    };
  }

  function createYandexMap(container, centerLatLng, zoom, options) {
    const opts = options || {};
    const map = new window.ymaps.Map(container, {
      center: centerLatLng,
      zoom,
      controls: opts.controls || ['zoomControl'],
    });
    if (opts.disableScrollZoom) map.behaviors.disable('scrollZoom');
    else map.behaviors.enable('scrollZoom');

    function invalidateSize() {
      try {
        map.container.fitToViewport();
      } catch (_) {
        /**/
      }
    }

    return { map, invalidateSize };
  }

  /** Демо-карта на странице «Доставка». */
  function initStaticMap(container, centerLatLng, zoom) {
    if (!(container instanceof HTMLElement)) return Promise.resolve(null);
    const center = Array.isArray(centerLatLng) && centerLatLng.length === 2 ? centerLatLng : DEFAULT_CENTER;
    const z = Number.isFinite(Number(zoom)) ? Number(zoom) : 12;
    return loadYmaps()
      .then((ymaps) => {
        if (!ymaps) return renderMapPlaceholder(container, MAP_UNAVAILABLE_MSG);
        container.innerHTML = '';
        const { map } = createYandexMap(container, center, z, { disableScrollZoom: false });
        return { engine: 'yandex', map };
      })
      .catch(() => renderMapPlaceholder(container, 'Не удалось загрузить Яндекс.Карты.'));
  }

  /**
   * Интерактивная карта: клик ставит метку (корзина / адрес оператора).
   */
  function attachInteractiveMap(container, centerLatLng, zoom, handlers) {
    if (!(container instanceof HTMLElement)) return Promise.resolve(null);
    const center = Array.isArray(centerLatLng) && centerLatLng.length === 2 ? centerLatLng : DEFAULT_CENTER;
    const z = Number.isFinite(Number(zoom)) ? Number(zoom) : 12;
    const onMapClick =
      handlers && typeof handlers.onMapClick === 'function' ? handlers.onMapClick : () => {};

    return loadYmaps()
      .then((ymaps) => {
        if (!ymaps) return renderMapPlaceholder(container, MAP_UNAVAILABLE_MSG);
        container.innerHTML = '';
        const { map, invalidateSize } = createYandexMap(container, center, z, {
          disableScrollZoom: false,
        });
        let placemark = null;

        function setMarker(lat, lon) {
          const coords = [lat, lon];
          if (!placemark) {
            placemark = new ymaps.Placemark(
              coords,
              {},
              { draggable: false, preset: 'islands#blueDotIcon' }
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

        function flyTo(lat, lon, zLevel) {
          map.setCenter([lat, lon], zLevel == null ? map.getZoom() : zLevel, { duration: 220 });
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
      })
      .catch(() => renderMapPlaceholder(container, 'Не удалось загрузить Яндекс.Карты.'));
  }

  function attachOrdersLayer(engine, hostMap, onPopupActionClose) {
    const closer = typeof onPopupActionClose === 'function' ? onPopupActionClose : () => {};
    if (engine !== 'yandex' || !hostMap || !window.ymaps) return null;

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
        closer();
      },
    };
  }

  /** Карта заказов оператора: маркеры + балуны. */
  function createOrdersMapHost(container, centerLatLng, zoom, popupRootHandler) {
    if (!(container instanceof HTMLElement)) return Promise.resolve(null);
    const center = Array.isArray(centerLatLng) && centerLatLng.length === 2 ? centerLatLng : [51.78, 55.11];
    const z = Number.isFinite(Number(zoom)) ? Number(zoom) : 11;

    return loadYmaps()
      .then((ymaps) => {
        if (!ymaps) return renderMapPlaceholder(container, MAP_UNAVAILABLE_MSG);

        container.innerHTML = '';
        const { map, invalidateSize } = createYandexMap(container, center, z, {
          disableScrollZoom: true,
        });

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

        const layerBundle = attachOrdersLayer('yandex', map, closePopupFn);
        if (!layerBundle) return renderMapPlaceholder(container, MAP_UNAVAILABLE_MSG);

        return {
          engine: 'yandex',
          map,
          invalidateSize,
          ...layerBundle,
          destroy() {
            try {
              map.destroy();
            } catch (_) {
              /**/
            }
          },
        };
      })
      .catch(() => renderMapPlaceholder(container, 'Не удалось загрузить Яндекс.Карты.'));
  }

  window.EkvalineMaps = {
    prefetch,
    getConfig,
    loadYmaps,
    initStaticMap,
    attachInteractiveMap,
    createOrdersMapHost,
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
