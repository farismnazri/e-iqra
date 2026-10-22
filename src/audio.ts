// No recordings are supplied. This policy cannot certify draft content.
// Never fall back to TTS or concatenate unapproved clips.
export const audio = { status: 'unavailable', policy: 'approved_only' } as const
