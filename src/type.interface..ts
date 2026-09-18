interface SetApiConfig {
  debug?: boolean;
  saveRequestFile?: string | undefined;
  timeout?: number;
  // Permite cancelar la llamada HTTP a SIFEN en curso (AbortController), p.ej. para
  // abortar un envio cuando SIFEN no responde dentro del tiempo límite.
  signal?: AbortSignal;
  // Ruta al archivo del certificado CA-root/CA-intermedia de SIFEN. Si se define,
  // se agrega como "ca" en el httpsAgent para validar el certificado del servidor.
  caCert?: string | null;
}

export { SetApiConfig };
