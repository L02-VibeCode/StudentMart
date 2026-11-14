/** Implement in the module that owns the resource, using its persisted source. */
export interface ResourceAccessResolver {
  ownerId?(resourceId: string): Promise<string | null>;
  isConversationMember?(resourceId: string, accountId: string): Promise<boolean>;
}
