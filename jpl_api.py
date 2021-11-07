from http.client import HTTPSConnection

codes = {
    'mercury': '199',
    'venus': '299',
    'earth': '399',
    'mars': '499',
    'jupiter': '599',
    'saturn': '699',
    'uranus': '799',
    'neptune': '899',
}


def get_data_from_api(planet_a, planet_b):
    conn = HTTPSConnection('ssd.jpl.nasa.gov')

    if not (planet_a in codes and planet_b in codes):
        raise Error('unknown planet')

    params = [
        ('format', 'text'), # there is also json, but its not really useful...
        ('COMMAND', f"'{codes[planet_b]}'"), # target body
        ('CENTER', f"'500@{codes[planet_a]}'"), # center body
        ('EPHEM_TYPE', "'VECTORS'"), # vector data
        ('START_TIME', "'2021-NOV-11%2000:00'"),
        ('STOP_TIME', "'2021-NOV-11%2000:01'"),
        ('VEC_TABLE', "'6'"), # only get light time plus few range things
        ('OBJ_DATA', "'NO'"),
        # ('CSV_FORMAT', "'YES'"),
    ]
    params_string = '&'.join(map(lambda x: f'{x[0]}={x[1]}', params))


    url = f'/api/horizons.api?{params_string}'

    conn.request('GET', url)

    resp = conn.getresponse()
    return resp.read()


def parse_result(text):
    start_symbol, end_symbol = bytes('$$SOE', 'ascii'), bytes('$$EOE', 'ascii')
    start = text.find(start_symbol) + len(start_symbol)
    end = text.find(end_symbol)
    data = text[start : end]

    # ord(\n) == 10
    lines = data.split(bytes('\n', 'ascii'))
    # only take first datapoint
    data_line = lines[2] # 0 is empty line, 1 is date
    lt = data_line[
        data_line.find(bytes('LT=', 'ascii')) + 4 :
        data_line.find(bytes(' RG', 'ascii'))
    ]
    return float(lt)

# data = get_data_from_api('mars', 'jupiter')
# d = parse_result(data)
# print(d)
