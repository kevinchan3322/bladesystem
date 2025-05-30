#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pandas as pd
import sys

# print(sys.argv[1], sys.argv[2])

if sys.argv[1].endswith('.xlsx'):
    df = pd.read_excel(sys.argv[1], sheet_name=sys.argv[2])
else:
    df = pd.read_csv(sys.argv[1])
    df = df.loc[:, ~df.columns.str.contains('^Unnamed')]

json_str = df.to_json(force_ascii=False,orient='records', date_format='iso')

sys.stdout.buffer.write(json_str.encode('utf-8'))