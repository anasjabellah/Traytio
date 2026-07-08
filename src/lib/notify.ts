import { showToast } from "nextjs-toast-notify";
import type { ToastOptions } from "nextjs-toast-notify";

type NotifyOptions = Partial<ToastOptions>;
type PromiseMessages<T> = {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: Error) => string);
};

const DEFAULTS = {
  position: "bottom-right" as const,
  transition: "bounceIn" as const,
  sound: false,
};

const DURATIONS: Record<string, number> = {
  success: 3000,
  info: 3000,
  warning: 4000,
  error: 5000,
};

function makeOptions(type: string, overrides?: NotifyOptions): ToastOptions {
  return {
    ...DEFAULTS,
    progress: true,
    duration: DURATIONS[type] ?? 3000,
    ...overrides,
  };
}

const ROTATION_KEYFRAMES =
  '<style>@keyframes ntn-spin{to{transform:rotate(360deg)}}.ntn-spinner{animation:ntn-spin .8s linear infinite}</style>';

const ICON_LOADING = `${ROTATION_KEYFRAMES}<svg class="ntn-spinner" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;

export const notify = {
  success(message: string, options?: NotifyOptions) {
    showToast.success(message, makeOptions("success", options));
  },

  error(message: string, options?: NotifyOptions) {
    showToast.error(message, makeOptions("error", options));
  },

  warning(message: string, options?: NotifyOptions) {
    showToast.warning(message, makeOptions("warning", options));
  },

  info(message: string, options?: NotifyOptions) {
    showToast.info(message, makeOptions("info", options));
  },

  loading(message: string, options?: NotifyOptions) {
    showToast.info(message, {
      ...makeOptions("info", options),
      icon: ICON_LOADING,
      duration: null,
    });
  },

  promise<T>(
    promise: Promise<T>,
    messages: PromiseMessages<T>,
    options?: NotifyOptions,
  ): Promise<T> {
    notify.loading(messages.loading, options);
    return promise.then(
      (data) => {
        const msg =
          typeof messages.success === "function"
            ? messages.success(data)
            : messages.success;
        notify.success(msg, options);
        return data;
      },
      (err: Error) => {
        const msg =
          typeof messages.error === "function"
            ? messages.error(err)
            : messages.error;
        notify.error(msg, options);
        throw err;
      },
    );
  },
};
