const shapeFlags = (flags: any) => flags.reduce((shapedFlags: any, flag: any) => {
  const [flagName, rawValue] = flag.split('=');
  const value = rawValue ? rawValue.replace(';', '') : true;
  return { ...shapedFlags, [flagName]: value };
}, {});

export const extractCookies = (headers: any) => {
  const cookies = headers['set-cookie']; // Cookie[]

  return cookies.reduce((shapedCookies: any, cookieString: any) => {
    const [rawCookie, ...flags] = cookieString.split('; ');
    const [cookieName, value] = rawCookie.split('=');
    return { ...shapedCookies, [cookieName]: { value, flags: shapeFlags(flags) } };
  }, {});
};
