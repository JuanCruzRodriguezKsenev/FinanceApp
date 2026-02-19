// Mock for next/server
export const NextRequest = class {};
export const NextResponse = class {
  static json(data: any, init?: ResponseInit) {
    return { data, ...init };
  }
  static redirect(url: string) {
    return { redirect: url };
  }
};
