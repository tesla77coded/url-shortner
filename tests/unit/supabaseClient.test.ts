
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ __isMockSupabaseClient: true })),
}));

describe('supabaseClient module (behavioral)', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('exports a supabase client created from env vars', async () => {
    process.env.SUPABASE_URL = 'https://x.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'srk';

    const mod = await import('../../src/lib/supabaseClient');

    expect(mod).toBeDefined();
    expect(mod.supabase).toBeDefined();
    expect((mod.supabase as any).__isMockSupabaseClient).toBe(true);
  });
});
