(function () {
  const BASE = '';
  const DEFAULT_CENTER = [51.7682, 55.0969];
  const MAP_UNAVAILABLE_MSG =
    'Карта недоступна: задайте YANDEX_MAPS_API_KEY в .env (ключ JavaScript API Яндекс.Карт).';

  let configCache = null;
  let configPromise = null;

  function readRuntimeMapsKey() {
    try {
      const w = typeof window !== 'undefined' ? window : {};
      const k = typeof w.__EKVALINE_YANDEX_MAPS_KEY__ === 'string' ? w.__EKVALINE_YANDEX_MAPS_KEY__.trim() : '';
      return k || null;
    } catch {
      return null;
    }
  }

  function cacheFromKey(key) {
    const trimmed = String(key || '').trim();
    if (!trimmed) return { provider: 'none', yandexMapsKey: null };
    return { provider: 'yandex', yandexMapsKey: trimmed };
  }

  function getConfig() {
    const runtimeKey = readRuntimeMapsKey();
    if (runtimeKey) {
      configCache = cacheFromKey(runtimeKey);
      return Promise.resolve(configCache);
    }
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
          const fallback = readRuntimeMapsKey();
          configCache = fallback ? cacheFromKey(fallback) : { provider: 'none', yandexMapsKey: null };
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
      if (/^(operator|delivery|catalog|cabinet)\.html$/i.test(leaf)) return true;
      if (document.getElementById('deliveryZoneMap')) return true;
      if (document.getElementById('checkoutMapRoot')) return true;
      if (document.getElementById('opxZoneMapCanvas')) return true;
      if (document.body?.classList?.contains?.('catalog-page')) return true;
      if (document.body?.classList?.contains?.('cabinet-page-full')) return true;
    } catch {
      /**/
    }
    return false;
  }

  let ymapsPromise = null;

  function ymapsRefererHint() {
    try {
      const origin = String(window.location?.origin || '').trim();
      if (origin && origin !== 'null') return `${origin}/*`;
    } catch {
      /**/
    }
    return 'http://31.129.96.146:3001/*';
  }

  function ymapsLoadFailMessage() {
    return `Не удалось загрузить Яндекс.Карты. Проверьте YANDEX_MAPS_API_KEY в .env и HTTP Referer в кабинете developer.tech.yandex.ru: ${ymapsRefererHint()}`;
  }

  function buildYmapsScriptUrl(apiKey, cspMode) {
    const base = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    if (cspMode === '202512') return `${base}&csp=202512`;
    if (cspMode === 'legacy') return `${base}&csp=true`;
    return base;
  }

  function removeYmapsScriptTags() {
    document.querySelectorAll('script[data-ek-ymaps-api="true"]').forEach((node) => node.remove());
  }

  function waitForYmapsReady(timeoutMs) {
    return new Promise((resolve, reject) => {
      if (!window.ymaps || typeof window.ymaps.ready !== 'function') {
        reject(new Error('ymaps_load_error'));
        return;
      }
      let settled = false;
      const timer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error('ymaps_ready_timeout'));
      }, timeoutMs);
      try {
        window.ymaps.ready(() => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          if (window.ymaps?.Map) resolve(window.ymaps);
          else reject(new Error('ymaps_load_error'));
        });
      } catch (err) {
        window.clearTimeout(timer);
        reject(err instanceof Error ? err : new Error('ymaps_load_error'));
      }
    });
  }

  function injectYmapsScript(apiKey, cspMode) {
    return new Promise((resolve, reject) => {
      if (window.ymaps?.Map) {
        waitForYmapsReady(12000).then(resolve).catch(reject);
        return;
      }
      const existing = document.querySelector(`script[data-ek-ymaps-api="true"][data-ek-ymaps-csp="${cspMode || 'none'}"]`);
      if (existing instanceof HTMLScriptElement) {
        existing.addEventListener('load', () => waitForYmapsReady(12000).then(resolve).catch(reject), { once: true });
        existing.addEventListener('error', () => reject(new Error('ymaps_load_error')), { once: true });
        queueMicrotask(() => {
          if (window.ymaps?.Map) waitForYmapsReady(12000).then(resolve).catch(reject);
        });
        return;
      }
      const s = document.createElement('script');
      s.async = true;
      s.setAttribute('data-ek-ymaps-api', 'true');
      s.setAttribute('data-ek-ymaps-csp', cspMode || 'none');
      s.src = buildYmapsScriptUrl(apiKey, cspMode);
      s.onload = () => {
        waitForYmapsReady(12000).then(resolve).catch(reject);
      };
      s.onerror = () => reject(new Error('ymaps_load_error'));
      document.head.appendChild(s);
    });
  }

  function loadYmaps() {
    if (typeof window !== 'undefined' && window.ymaps && window.ymaps.Map) {
      return waitForYmapsReady(12000);
    }
    if (ymapsPromise) return ymapsPromise;
    ymapsPromise = getConfig().then(async (c) => {
      if (!c?.yandexMapsKey) return null;
      const modes = ['202512', 'legacy', null];
      let lastError = null;
      for (const mode of modes) {
        try {
          if (lastError) {
            removeYmapsScriptTags();
            try {
              delete window.ymaps;
            } catch {
              window.ymaps = undefined;
            }
          }
          const ymaps = await injectYmapsScript(c.yandexMapsKey, mode);
          return ymaps;
        } catch (err) {
          lastError = err;
        }
      }
      throw lastError || new Error('ymaps_load_error');
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

  const YMAP_CHROME_SELECTORS = [
    '[class*="copyright"]',
    '[class*="gotoymaps"]',
    '[class*="gototech"]',
    '[class*="open-block"]',
    '[class*="map-open"]',
  ];

  function applyYandexMapChromeHide(container) {
    if (!(container instanceof HTMLElement)) return;
    YMAP_CHROME_SELECTORS.forEach((sel) => {
      container.querySelectorAll(sel).forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('visibility', 'hidden', 'important');
        node.style.setProperty('opacity', '0', 'important');
        node.style.setProperty('pointer-events', 'none', 'important');
        node.setAttribute('aria-hidden', 'true');
      });
    });
  }

  /** Скрывает © и «Открыть в Яндекс.Картах» (классы меняются между версиями 2.1.x). */
  function hideYandexMapChrome(container) {
    if (!(container instanceof HTMLElement)) return () => {};
    container.classList.add('ek-map-host');
    const hide = () => applyYandexMapChromeHide(container);
    hide();
    const obs = new MutationObserver(() => hide());
    obs.observe(container, { childList: true, subtree: true });
    window.setTimeout(hide, 80);
    window.setTimeout(hide, 400);
    window.setTimeout(hide, 1200);
    return () => obs.disconnect();
  }

  function scheduleMapInvalidate(invalidateSize) {
    if (typeof invalidateSize !== 'function') return;
    const run = () => {
      try {
        invalidateSize();
      } catch (_) {
        /**/
      }
    };
    queueMicrotask(run);
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(run);
      requestAnimationFrame(() => requestAnimationFrame(run));
    }
    window.setTimeout(run, 120);
    window.setTimeout(run, 450);
  }

  function waitForContainerSize(container, timeoutMs = 2500) {
    return new Promise((resolve) => {
      if (!(container instanceof HTMLElement)) {
        resolve(false);
        return;
      }
      const ready = () => container.offsetWidth > 48 && container.offsetHeight > 48;
      if (ready()) {
        resolve(true);
        return;
      }
      let obs = null;
      if (typeof ResizeObserver === 'function') {
        obs = new ResizeObserver(() => {
          if (!ready()) return;
          obs?.disconnect();
          resolve(true);
        });
        obs.observe(container);
      }
      window.setTimeout(() => {
        obs?.disconnect();
        resolve(ready());
      }, timeoutMs);
    });
  }

  function createYandexMap(container, centerLatLng, zoom, options) {
    const opts = options || {};
    if (container instanceof HTMLElement && !container.id) {
      container.id = `ek-map-${Math.random().toString(36).slice(2, 10)}`;
    }
    const mapTarget =
      container instanceof HTMLElement && container.id ? container.id : container;
    const map = new window.ymaps.Map(
      mapTarget,
      {
        center: centerLatLng,
        zoom,
        controls: opts.controls || ['zoomControl'],
      },
      {
        suppressMapOpenBlock: true,
        suppressObsoleteBrowserNotifier: true,
      }
    );
    if (opts.disableScrollZoom) map.behaviors.disable('scrollZoom');
    else map.behaviors.enable('scrollZoom');

    const stopChromeObserver = hideYandexMapChrome(container);

    function invalidateSize() {
      try {
        if (container instanceof HTMLElement) {
          void container.offsetWidth;
          void container.offsetHeight;
        }
        map.container.fitToViewport();
      } catch (_) {
        /**/
      }
      applyYandexMapChromeHide(container);
    }

    scheduleMapInvalidate(invalidateSize);

    return { map, invalidateSize, detachMapChrome: stopChromeObserver };
  }

  /** Демо-карта на странице «Доставка». */
  function initStaticMap(container, centerLatLng, zoom) {
    if (!(container instanceof HTMLElement)) return Promise.resolve(null);
    const center = Array.isArray(centerLatLng) && centerLatLng.length === 2 ? centerLatLng : DEFAULT_CENTER;
    const z = Number.isFinite(Number(zoom)) ? Number(zoom) : 12;
    return waitForContainerSize(container)
      .then(() => loadYmaps())
      .then((ymaps) => {
        if (!ymaps) return renderMapPlaceholder(container, MAP_UNAVAILABLE_MSG);
        container.innerHTML = '';
        const { map, invalidateSize, detachMapChrome } = createYandexMap(container, center, z, {
          disableScrollZoom: false,
        });
        scheduleMapInvalidate(invalidateSize);
        return {
          engine: 'yandex',
          map,
          invalidateSize,
          destroy() {
            try {
              detachMapChrome?.();
            } catch (_) {
              /**/
            }
            try {
              map.destroy();
            } catch (_) {
              /**/
            }
            container.innerHTML = '';
          },
        };
      })
      .catch(() => renderMapPlaceholder(container, ymapsLoadFailMessage()));
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

    return waitForContainerSize(container)
      .then(() => loadYmaps())
      .then((ymaps) => {
        if (!ymaps) return renderMapPlaceholder(container, MAP_UNAVAILABLE_MSG);
        container.innerHTML = '';
        const { map, invalidateSize, detachMapChrome } = createYandexMap(container, center, z, {
          disableScrollZoom: false,
        });
        scheduleMapInvalidate(invalidateSize);
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
              detachMapChrome?.();
            } catch (_) {
              /**/
            }
            try {
              map.destroy();
            } catch (_) {
              /**/
            }
          },
        };
      })
      .catch(() => renderMapPlaceholder(container, ymapsLoadFailMessage()));
  }

  function createPopupClickHandler(closePopupFn, popupRootHandler) {
    return function onPopupActionClick(event) {
      const t = event.target;
      if (!(t instanceof Element)) return;
      const btOrder = t.closest('[data-opx-zone-open-order]');
      if (btOrder) {
        event.preventDefault();
        event.stopPropagation();
        closePopupFn();
        if (popupRootHandler) popupRootHandler({ type: 'order', btn: btOrder });
        return;
      }
      const btn = t.closest('[data-opx-zone-open-client]');
      if (btn) {
        event.preventDefault();
        event.stopPropagation();
        closePopupFn();
        if (popupRootHandler) popupRootHandler({ type: 'client', btn: btn });
      }
    };
  }

  function bindOrdersMapPopupNav(hostContainer, map, closePopupFn, popupRootHandler) {
    const onClick = createPopupClickHandler(closePopupFn, popupRootHandler);
    const roots = [];
    if (hostContainer instanceof HTMLElement) roots.push(hostContainer);
    try {
      const mapEl = map?.container?.getElement?.();
      if (mapEl instanceof HTMLElement && !roots.includes(mapEl)) roots.push(mapEl);
    } catch (_) {
      /**/
    }
    roots.forEach((root) => {
      if (root._ekvalinePopupNav) return;
      root._ekvalinePopupNav = true;
      root.addEventListener('click', onClick, true);
    });

    if (!map?.balloon?.events) return onClick;

    map.balloon.events.add('open', () => {
      window.setTimeout(() => {
        try {
          const balloonEl = map.balloon.getElement();
          if (!(balloonEl instanceof HTMLElement)) return;
          if (!balloonEl._ekvalinePopupNav) {
            balloonEl._ekvalinePopupNav = true;
            balloonEl.addEventListener('click', onClick, true);
          }
          balloonEl.querySelectorAll('[class*="balloon__content"]').forEach((node) => {
            if (!(node instanceof HTMLElement) || node._ekvalinePopupNav) return;
            node._ekvalinePopupNav = true;
            node.addEventListener('click', onClick, true);
          });
        } catch (_) {
          /**/
        }
      }, 0);
    });

    return onClick;
  }

  function attachZoneRegions(hostMap, regions) {
    if (!hostMap || !window.ymaps || !Array.isArray(regions) || !regions.length) {
      return { clearZones() {} };
    }
    const collection = new window.ymaps.GeoObjectCollection();
    hostMap.geoObjects.add(collection);
    regions.forEach((region) => {
      if (!region || !Array.isArray(region.center) || region.center.length !== 2) return;
      const radiusM = Number(region.radiusM);
      const color = String(region.color || '#1565c0');
      const name = String(region.name || 'Зона');
      const circle = new window.ymaps.Circle(
        [region.center, Number.isFinite(radiusM) && radiusM > 0 ? radiusM : 2500],
        {
          hintContent: name,
          balloonContent: `<strong>${name}</strong>`,
        },
        {
          fillColor: `${color}26`,
          strokeColor: color,
          strokeWidth: 2,
          strokeOpacity: 0.75,
          fillOpacity: 0.12,
          interactivityModel: 'default#transparent',
        }
      );
      collection.add(circle);
    });
    return {
      clearZones() {
        collection.removeAll();
      },
    };
  }

  function attachOrdersLayer(hostMap, onPopupActionClose) {
    const closer = typeof onPopupActionClose === 'function' ? onPopupActionClose : () => {};
    if (!hostMap || !window.ymaps) return null;

    const collection = new window.ymaps.GeoObjectCollection();
    hostMap.geoObjects.add(collection);
    return {
      engine: 'yandex',
      layer: collection,
      clear() {
        collection.removeAll();
      },
      addOrderMarker(lat, lng, ringColor, balloonHtml, hintText) {
        const pm = new window.ymaps.Placemark(
          [lat, lng],
          {
            balloonContent: balloonHtml,
            hintContent: String(hintText || ''),
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

  /** Карта заказов оператора: Яндекс.Карты, маркеры по статусу заказа. */
  function createOrdersMapHost(container, centerLatLng, zoom, popupRootHandler, zoneRegions) {
    if (!(container instanceof HTMLElement)) return Promise.resolve(null);
    const center = Array.isArray(centerLatLng) && centerLatLng.length === 2 ? centerLatLng : [51.78, 55.11];
    const z = Number.isFinite(Number(zoom)) ? Number(zoom) : 11;

    return waitForContainerSize(container)
      .then(() => loadYmaps())
      .then((ymaps) => {
        if (!ymaps) return renderMapPlaceholder(container, MAP_UNAVAILABLE_MSG);

        container.innerHTML = '';
        const { map, invalidateSize, detachMapChrome } = createYandexMap(container, center, z, {
          disableScrollZoom: true,
        });
        scheduleMapInvalidate(invalidateSize);

        function closePopupFn() {
          try {
            map.balloon.close();
          } catch (_) {
            /**/
          }
        }

        bindOrdersMapPopupNav(container, map, closePopupFn, popupRootHandler);

        attachZoneRegions(map, zoneRegions);
        const layerBundle = attachOrdersLayer(map, closePopupFn);
        if (!layerBundle) return renderMapPlaceholder(container, MAP_UNAVAILABLE_MSG);

        return {
          engine: 'yandex',
          map,
          invalidateSize,
          ...layerBundle,
          destroy() {
            try {
              detachMapChrome?.();
            } catch (_) {
              /**/
            }
            try {
              map.destroy();
            } catch (_) {
              /**/
            }
          },
        };
      })
      .catch(() => renderMapPlaceholder(container, ymapsLoadFailMessage()));
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
