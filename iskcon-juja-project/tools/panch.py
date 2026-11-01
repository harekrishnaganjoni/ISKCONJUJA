# Minimal tithi / sunrise engine (Meeus, Astronomical Algorithms ch. 25, 47, 15). Python stdlib only.
import math, datetime as dt
D2R = math.pi/180
def jd_from(d):  # d = aware UTC datetime
    y,m = d.year, d.month
    day = d.day + (d.hour + d.minute/60 + d.second/3600)/24
    if m <= 2: y -= 1; m += 12
    A = y//100; B = 2 - A + A//4
    return int(365.25*(y+4716)) + int(30.6001*(m+1)) + day + B - 1524.5
def dt_from_jd(jd):
    return dt.datetime(2000,1,1,12,tzinfo=dt.timezone.utc) + dt.timedelta(days=jd-2451545.0)
def norm(x): return x % 360.0
def sun_lon(jd):
    T = (jd-2451545.0)/36525
    L0 = norm(280.46646 + 36000.76983*T + 0.0003032*T*T)
    M = norm(357.52911 + 35999.05029*T - 0.0001537*T*T)
    C = (1.914602 - 0.004817*T - 0.000014*T*T)*math.sin(M*D2R) + (0.019993 - 0.000101*T)*math.sin(2*M*D2R) + 0.000289*math.sin(3*M*D2R)
    om = 125.04 - 1934.136*T
    return norm(L0 + C - 0.00569 - 0.00478*math.sin(om*D2R))   # apparent
# Moon: principal periodic terms of longitude (units 1e-6 deg): (D, M, Mp, F, coeff)
MOON = [(0,0,1,0,6288774),(2,0,-1,0,1274027),(2,0,0,0,658314),(0,0,2,0,213618),(0,1,0,0,-185116),(0,0,0,2,-114332),
 (2,0,-2,0,58793),(2,-1,-1,0,57066),(2,0,1,0,53322),(2,-1,0,0,45758),(0,1,-1,0,-40923),(1,0,0,0,-34720),(0,1,1,0,-30383),
 (2,0,0,-2,15327),(0,0,1,2,-12528),(0,0,1,-2,10980),(4,0,-1,0,10675),(0,0,3,0,10034),(4,0,-2,0,8548),(2,1,-1,0,-7888),
 (2,1,0,0,-6766),(1,0,-1,0,-5163),(1,1,0,0,4987),(2,-1,1,0,4036),(2,0,2,0,3994),(4,0,0,0,3861),(2,0,-3,0,3665),
 (0,1,-2,0,-2689),(2,0,-1,2,-2602),(2,-1,-2,0,2390),(1,0,1,0,-2348),(2,-2,0,0,2236),(0,1,2,0,-2120),(0,2,0,0,-2069),
 (2,-2,-1,0,2048),(2,0,1,-2,-1773),(2,0,0,2,-1595),(4,-1,-1,0,1215),(0,0,2,2,-1110),(3,0,-1,0,-892),(2,1,1,0,-810),
 (4,-1,-2,0,759),(0,2,-1,0,-713),(2,2,-1,0,-700),(2,1,-2,0,691),(2,-1,0,-2,596),(4,0,1,0,549),(0,0,4,0,537),(4,-1,0,0,520),(1,0,-2,0,-487)]
def moon_lon(jd):
    T = (jd-2451545.0)/36525
    Lp = norm(218.3164477 + 481267.88123421*T - 0.0015786*T*T)
    D = norm(297.8501921 + 445267.1114034*T - 0.0018819*T*T)
    M = norm(357.5291092 + 35999.0502909*T - 0.0001536*T*T)
    Mp = norm(134.9633964 + 477198.8675055*T + 0.0087414*T*T)
    F = norm(93.2720950 + 483202.0175233*T - 0.0036539*T*T)
    E = 1 - 0.002516*T - 0.0000074*T*T
    A1 = norm(119.75 + 131.849*T); A2 = norm(53.09 + 479264.290*T)
    s = 0.0
    for d,m,mp,f,c in MOON:
        arg = (d*D + m*M + mp*Mp + f*F)*D2R
        s += c*(E**abs(m))*math.sin(arg)
    s += 3958*math.sin(A1*D2R) + 1962*math.sin((Lp-F)*D2R) + 318*math.sin(A2*D2R)
    # nutation in longitude (approx) so both bodies are "apparent"
    om = 125.04 - 1934.136*T
    nut = -0.00478*math.sin(om*D2R)
    return norm(Lp + s/1e6 + nut)
def elong(jd): return norm(moon_lon(jd) - sun_lon(jd))
def tithi(jd): return int(elong(jd)//12) + 1       # 1..30
def sunrise_utc(date, lat, lon):
    """Sunrise (apparent upper limb, refraction 34') for a local civil date; returns UTC datetime."""
    jd0 = jd_from(dt.datetime(date.year,date.month,date.day,tzinfo=dt.timezone.utc))
    t = jd0 + 0.5 - lon/360          # first guess: local solar noon is 0.5 day - lon/360 after 0h UT
    for _ in range(6):
        T = (t-2451545.0)/36525
        L0 = norm(280.46646 + 36000.76983*T); M = norm(357.52911 + 35999.05029*T)
        C = (1.914602-0.004817*T)*math.sin(M*D2R) + 0.019993*math.sin(2*M*D2R) + 0.000289*math.sin(3*M*D2R)
        lam = L0 + C - 0.00569 - 0.00478*math.sin((125.04-1934.136*T)*D2R)
        eps = 23.439291 - 0.0130042*T + 0.00256*math.cos((125.04-1934.136*T)*D2R)
        dec = math.asin(math.sin(eps*D2R)*math.sin(lam*D2R))
        ra = math.atan2(math.cos(eps*D2R)*math.sin(lam*D2R), math.cos(lam*D2R))/D2R
        # equation of time (minutes) from L0 and RA
        eot = 4*(norm(L0 - 0.0057183 - norm(ra) + 180) - 180)
        h0 = -0.833
        cosH = (math.sin(h0*D2R) - math.sin(lat*D2R)*math.sin(dec))/(math.cos(lat*D2R)*math.cos(dec))
        H = math.acos(max(-1,min(1,cosH)))/D2R
        noon = jd0 + 0.5 - lon/360 - eot/1440
        t = noon - H/360
    return dt_from_jd(t)
