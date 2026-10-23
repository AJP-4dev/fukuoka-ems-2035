"""年齢6帯（k=0-6, j=7-17, w=18-64, e1=65-74, e2=75-84, e3=85+）の搬送率。純関数のみ。"""
GROUPS = ['k', 'j', 'w', 'e1', 'e2', 'e3']
BAND_WEIGHTS = {
    '0～4歳': {'k': 1}, '5～9歳': {'k': 0.4, 'j': 0.6}, '10～14歳': {'j': 1},
    '15～19歳': {'j': 0.6, 'w': 0.4},
    **{f'{a}～{a+4}歳': {'w': 1} for a in range(20, 65, 5)},
    '65～69歳': {'e1': 1}, '70～74歳': {'e1': 1},
    '75～79歳': {'e2': 1}, '80～84歳': {'e2': 1},
    '85～89歳': {'e3': 1}, '90歳以上': {'e3': 1},
}
ELDERS = ('e1', 'e2', 'e3')


def to_groups(pop19):
    out = dict.fromkeys(GROUPS, 0.0)
    for band, n in pop19.items():
        for g, wt in BAND_WEIGHTS[band].items():
            out[g] += n * wt
    return out


def national_rates(national):
    return {e: national['transport'][e] / national['pop'][e] for e in ELDERS}


def fukuoka_rates(transport_age, pop19_2025, national):
    g = to_groups(pop19_2025)
    nat = national_rates(national)
    m = transport_age['高齢者'] / sum(nat[e] * g[e] for e in ELDERS)
    return {
        'k': (transport_age['新生児'] + transport_age['乳幼児']) / g['k'],
        'j': transport_age['少年'] / g['j'],
        'w': transport_age['成人'] / g['w'],
        **{e: m * nat[e] for e in ELDERS},
    }
