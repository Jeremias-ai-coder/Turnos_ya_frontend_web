import { flushSync } from 'react-dom';
import type { NavigateFunction, NavigateOptions } from 'react-router-dom';

export interface SmoothNavigationOptions extends NavigateOptions {
  direction?: 'forward' | 'backward';
}

const getRouteDepth = (path: string): number => {
  if (path === '/') return 0;
  if (path.includes('/book')) return 3; // Turnos
  if (path.startsWith('/businesses/')) return 2; // Detalle
  if (path === '/recover' || path === '/reset-password') return 2; // Subflujos auth
  return 1; // Paneles y citas
};

export const startSmoothNavigation = (
  navigate: NavigateFunction,
  to: string | number,
  options?: SmoothNavigationOptions,
  currentPath: string = window.location.pathname
) => {
  let direction: 'forward' | 'backward' = 'forward';

  if (options?.direction) {
    direction = options.direction;
  } else if (typeof to === 'number') {
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
      if (typeof to === 'number') {
        // En React Router v6, navigate(number) delega asíncronamente a window.history.go(n).
        // Retornamos una Promise para que startViewTransition espere el evento popstate y render de React.
        return new Promise<void>((resolve) => {
          let done = false;
          const finish = () => {
            if (!done) {
              done = true;
              window.removeEventListener('popstate', handlePop);
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              resolve();
            }
          };
          const handlePop = () => {
            requestAnimationFrame(() => {
              setTimeout(finish, 16);
            });
          };
          window.addEventListener('popstate', handlePop, { once: true });
          navigate(to);
          setTimeout(finish, 250); // Timeout de resguardo por si el stack no produce popstate
        });
      }

      flushSync(() => {
        navigate(to, options);
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
