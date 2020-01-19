# -*- coding: utf-8 -*-

import glob
import datetime
import re
import sys
import os
import json
import pandas as pd

def json2csv():
	"""
	準備:
	TradeHistoryFetcher.js を使って取引履歴を全てコピーし trade_history.json にペーストしておく
	"""
	trades = json.loads(open("trade_history.json").read())
	trades.sort(key=lambda e: e["executed_at"])
	print("trades", len(trades))
	labels = ["注文ID","取引ID","通貨ペア","売/買","数量","価格","手数料","M/T","取引日時"]
	srcs = ["order_id", "trade_id", "pair", "side", "amount", "price", "fee_amount_quote", "maker_taker", "executed_at"]
	def filter(name, value):
		if name=="executed_at":
			d = datetime.datetime.fromtimestamp(value//1000, tz=datetime.timezone.utc)
			d += datetime.timedelta(hours=9) # UTC->JST
			return d.strftime('%Y/%m/%d %H:%M:%S')
		return value
	es = [ [ filter(name, v[name]) for name in srcs ] for v in trades ]
	o = pd.DataFrame(es, columns=labels)
	print(o)
	o.to_csv("generated_trade_history.csv", float_format='%.8f', index=False)

def gen():
	lines = []
	for filename in glob.glob("trade_history_*.csv"):
		lines += list(map(lambda s: s.rstrip(), open(filename).readlines()))[1:]
	def fix(s):
		fs = s.split(",")
		d = fs[-1]
		if re.search(r'\d\d\d\d/\d{1,2}/\d{1,2} \d{1,2}:\d{1,2}$', d):
			d += ":00"
		d = datetime.datetime.strptime(d, '%Y/%m/%d %H:%M:%S').strftime('%Y/%m/%d %H:%M:%S')
		fs[-1] = d
		return ",".join(fs)
	lines = [ fix(s) for s in lines ]
	lines.sort(key=lambda s: s.split(",")[-1], reverse=False)
	lines = ["""注文ID,取引ID,通貨ペア,売/買,数量,価格,手数料,M/T,取引日時"""] + lines
	with open("all.csv", "w") as f:
		print("\n".join(lines), file=f)

def validate(filename):
	lines = list(map(lambda s: s.rstrip(), open(filename).readlines()))[1:]

	print(len(lines), "trades")

	tradeIDs = {}
	ls = set()
	for line in lines:
		if len(line):
			assert line not in ls, ("already appear", line)
			ls.add(line)
	#		print(line.split(","))
			tradeID = line.split(",")[1]
			tradeIDs.setdefault(tradeID, []).append(line)

	errorTradeIDs = []
	for tradeID in sorted(tradeIDs.keys()):
		ls = tradeIDs[tradeID]
		if 1 < len(ls):
			errorTradeIDs.append(tradeID)

	if 0 < len(errorTradeIDs):
		for tradeID in errorTradeIDs:
			ls = tradeIDs[tradeID]
			print("tradeID", tradeID, "has more than 1 trades", len(ls))
	else:
		print("OK")

#gen()
#validate("all.csv")
json2csv()
validate("generated_trade_history.csv")

