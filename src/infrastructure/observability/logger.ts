export interface LogFields {
  requestId?: string;
  route?: string;
  subjectHash?: string;
  decisionId?: string;
  durationMs?: number;
  statusCode?: number;
  errorCode?: string;
  aiProvider?: string;
  foundryProject?: string;
  routerDeployment?: string;
  routedModel?: string;
  routerPolicy?: string;
  aiLatencyMs?: number;
  [key: string]: unknown;
}

export const logger = {
  info(message: string, fields?: LogFields) {
    console.log(JSON.stringify({ level: 'info', message, ...fields, timestamp: new Date().toISOString() }));
  },
  error(message: string, fields?: LogFields) {
    console.error(JSON.stringify({ level: 'error', message, ...fields, timestamp: new Date().toISOString() }));
  },
};
