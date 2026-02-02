// Audit service - stubbed out (audit_logs table removed in migration 008)
// Audit logging can be re-implemented with a different approach in the future

export interface AuditLogData {
  userId: string
  action: string
  resourceType: string
  resourceId: string
  details?: Record<string, any>
}

export async function logAudit(data: AuditLogData): Promise<void> {
  // Stubbed out - audit_logs table has been removed
  // If audit logging is needed, implement with external service or console logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT]', {
      userId: data.userId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      details: data.details,
      timestamp: new Date().toISOString()
    })
  }

  // No-op for production
  return Promise.resolve()
}
