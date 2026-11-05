import { flushSync } from 'react-dom';
import type { NavigateFunction, NavigateOptions } from 'react-router-dom';

const getRouteDepth = (path: string): number => {
  if (path === '/') return 0;
  if (path.includes('/book')) return 3; // Turnos
  if (path.startsWith('/businesses/')) return 2; // Detalle
  return 1; // Paneles y citas
};

export const startSmoothNavigation = (
  navigate: NavigateFunction,
  to: string | number,
  options?: NavigateOptions,
  currentPath: string = window.location.pathname
) => {
  let direction: 'forward' | 'backward' = 'forward';

  if (typeof to === 'number') {
    if (to < 0) direction = 'backward';
  } else {
    const targetPath = to.split('?')[0];
    if (targetPath === currentPath) {
      // Misma ruta (filtros, parámetros de búsqueda): navegación directa sin deslizamiento de pantalla
      if (typeof (document as any) !== 'undefined' && typeof (document as any).startViewTransition === 'function') {
        (document as any).startViewTransition(() => {
          flushSync(() => {
            navigate(to, options);
          });
        });
      } else {
        navigate(to, options);
      }
      return;
    }

    const oldDepth = getRouteDepth(currentPath);
    const newDepth = getRouteDepth(targetPath);
    direction = newDepth < oldDepth ? 'backward' : 'forward';
  }

  // Establecer atributo en HTML para que el CSS aplique los keyframes correspondientes
  document.documentElement.dataset.transitionDir = direction;

  const doc = document as any;
  if (typeof doc !== 'undefined' && typeof doc.startViewTransition === 'function') {
    const vt = doc.startViewTransition(() => {
      flushSync(() => {
        if (typeof to === 'number') {
          navigate(to);
        } else {
          navigate(to, options);
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });
    });
    if (vt && typeof vt.finished?.then === 'function') {
      vt.finished.finally(() => {
        delete document.documentElement.dataset.transitionDir;
      });
    }
  } else {
    if (typeof to === 'number') {
      navigate(to);
    } else {
      navigate(to, options);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }
};
