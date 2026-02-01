import { createServiceRoleClient } from '@/lib/supabase/server'

export interface AuditLogData {
  userId: string
  action: string
  resourceType: string
  resourceId: string
  details?: Record<string, any>
}

export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    const supabase = await createServiceRoleClient()

    await supabase.from('audit_logs').insert({
      user_id: data.userId,
      action: data.action,
      resource_type: data.resourceType,
      resource_id: data.resourceId,
      details: data.details || null,
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}
