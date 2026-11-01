from panch import *
import datetime as dt
EK = (11, 26)
def day_info(d, lat, lon):
    sr = sunrise_utc(d, lat, lon); aru = sr - dt.timedelta(minutes=96)
    return dict(date=d, sr=sr, t_sr=tithi(jd_from(sr)), t_aru=tithi(jd_from(aru)))
def ekadashis(start, end, lat, lon):
    days = []; d = start - dt.timedelta(days=1)
    while d <= end + dt.timedelta(days=2):
        days.append(day_info(d, lat, lon)); d += dt.timedelta(days=1)
    out = []; notes = []
    for i in range(1, len(days)-1):
        a, b = days[i], days[i+1]
        if not (start <= a['date'] <= end): continue
        if a['t_sr'] in EK:
            if b['t_sr'] in EK:           # Ekadashi at two sunrises: Vaishnavas fast the second day (Unmilani)
                continue
            if days[i-1]['t_sr'] in EK:   # this is the second of two
                out.append((a['date'], 'Unmilani (Ekadashi at two sunrises, fast the second)')); continue
            if a['t_aru'] in (10, 25):    # Dashami touches arunodaya: viddha, fast Dvadashi
                out.append((b['date'], 'Viddha: Dashami at dawn, fast moved to Dvadashi')); continue
            out.append((a['date'], 'pure'))
        elif a['t_sr'] in (10, 25) and b['t_sr'] in (12, 27):
            out.append((b['date'], 'CHECK: Ekadashi falls between two sunrises (kshaya)'))
    return out
if __name__ == "__main__":
    import sys
    lat, lon = (34.6867, -118.1542)
    for y in (2026, 2027):
        r = ekadashis(dt.date(y,1,1), dt.date(y,12,31), lat, lon)
        print(y, len(r))
        for d, n in r: print(" ", d, d.strftime("%a"), n)
