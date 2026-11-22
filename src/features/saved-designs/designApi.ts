import type { DesignState } from '../../types/design'
import { supabase } from '../../lib/supabase'

export const isBackendEnabled = supabase !== null

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no confusing 0/O, 1/I
function makeCode(length = 6): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return code
}

/** Saves a design and returns its share code. */
export async function saveDesign(design: DesignState): Promise<string> {
  if (!supabase) throw new Error('Backend is not configured')
  const code = makeCode()
  const { error } = await supabase.from('designs').insert({ code, data: design })
  if (error) throw error
  return code
}

/** Loads a design by its share code (or null if not found). */
export async function loadDesign(code: string): Promise<DesignState | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('designs')
    .select('data')
    .eq('code', code.toUpperCase())
    .maybeSingle()
  if (error) throw error
  return data ? (data.data as DesignState) : null
}
