interface SetApiConfig {
  debug?: boolean;
  saveRequestFile?: string | undefined;
  timeout?: number;
  // Permite cancelar la llamada HTTP a SIFEN en curso (AbortController), p.ej. para
  // abortar un envio cuando SIFEN no responde dentro del tiempo límite.
  signal?: AbortSignal;
}

export { SetApiConfig };
