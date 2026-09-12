export type AuthContext = {
  subjectId: string;
  sessionId: string;
  isAuthenticated: boolean;
};

export async function getAuthContext(): Promise<AuthContext> {
  // Auth context provider stub
  return {
    subjectId: 'anonymous-subject',
    sessionId: 'session-id-stub',
    isAuthenticated: false,
  };
}
