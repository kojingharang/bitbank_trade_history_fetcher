/*
ログイン状態で
https://app.bitbank.cc/account/trade_history
を開いて dev console でこのスクリプトをコピペして getAll() すると取引履歴 json が出てくる.

※無保証
*/
var token = JSON.parse(localStorage.getItem("bb_trade_token"));

function formatDate (date, format) {
  format = format.replace(/yyyy/g, date.getFullYear());
  format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
  format = format.replace(/dd/g, ('0' + date.getDate()).slice(-2));
  format = format.replace(/HH/g, ('0' + date.getHours()).slice(-2));
  format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
  format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
  format = format.replace(/SSS/g, ('00' + date.getMilliseconds()).slice(-3));
  return format;
};

function d2s(t) {
	return formatDate(new Date(t), "yyyy/MM/dd HH:mm:ss.SSS");
}

// Extract log function
var iframe = document.createElement('iframe');
iframe.style.display = 'none';
document.body.appendChild(iframe);
var log = iframe.contentWindow.console.log;

var gTrades = [];
var gTradeIds = {}; // string -> any
var countPerAPI = 500;
function addTrades(S, E, type, trades, cont) {
	log("GOT", trades.length, "trades for", type, d2s(S), "-", d2s(E));
	if(trades.length==countPerAPI) {
		var s0 = S;
		var e0 = Math.floor((S+E)/2);
		var s1 = e0;
		var e1 = E;
		log("Too many trades. split into", d2s(s0), "-", d2s(e0), "and", d2s(s1), "-", d2s(e1));
		downloadTrades(s0, e0, type, function() {
			downloadTrades(s1, e1, type, function() {
				cont();
			});
		});
	} else {
		log("ADD.");
		for(var i=0;i<trades.length;i++) {
			var tid = trades[i]["trade_id"];
			if(!(tid in gTradeIds)) {
				gTradeIds[tid] = 1;
				gTrades.push(trades[i]);
			}
		}
		cont();
	}
}
function downloadTrades(S, E, type, cont) {
	log("downloadTrades", d2s(S), d2s(E), type)
	var url = "https://api.bitbank.cc/user/spot/trade_history";
	if(type=="archived") {
		url = "https://api.bitbank.cc/user/spot/trade_archived_history";
	}
	setTimeout(function() {
		$.ajax({
			type:"GET",
			url:url,
			data:{
				"since":S,
				"end":E,
				"count":countPerAPI,
				"order": "asc",
				"ts": new Date().getTime(),
			},
			headers:{"token":token},
			success: function(v,dt) {
				addTrades(S, E, type, v["data"]["trades"], cont);
			},
			error:function(a,b,c) {
				log("ERROR",a,b,c);
			},
		});
	}, 100);
}

function getAll() {
	gTrades = [];
	gTradeIds = {};
	E = new Date().getTime();
	S = E - 2*365*24*60*60*1000;
	log(S, E);
	// 2019のどこかで archived API は廃止されたようだ
//	downloadTrades(S, E, "latest", function() {
//		downloadTrades(S, E, "archived", function() {
//			log("END.", gTrades.length, "trades. copy&paste this.");
//			json = JSON.stringify(gTrades, null, 4);
//			log(json)
//		});
//	});
	downloadTrades(S, E, "latest", function() {
		log("END.", gTrades.length, "trades. copy&paste this.");
		json = JSON.stringify(gTrades, null, 4);
		log(json)
	});
}

