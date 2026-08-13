declare module '@fancyapps/ui' {
  type OptionsType = {
    infinite?: boolean;
    [key: string]: any;
  };

  export const Fancybox: {
    bind: (selector: string | HTMLElement | null, options?: Partial<OptionsType>) => void;
    unbind: (selector: string | HTMLElement | null) => void;
    close: () => void;
  };
}
