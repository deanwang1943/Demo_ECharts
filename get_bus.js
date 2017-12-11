"use strict"
var self = this;

self.route = "45";
self.site = "12";
//城市
//self.currentcity = Session.getCurrentCity(); //当前城市{Code:420100,Name:武汉}
self.currCityCode = "420100"; //self.currentcity.Code;
self.currCityName = "武汉"; //self.currentcity.Name;
self.swEntity = {};

self.list = [];
var lineType = 0;
//初始化公交和地铁的数量
var z = 0;
var dt = 0;
var state = false;

var busline = new BMap.BusLineSearch(self.currCityName, {
	//renderOptions: { map: map, panel: "results" },

	//获取指定编号的所有线路
	onGetBusListComplete: function (busListResult) {
		var y = 0;
		var up = 0;
		state = false;
		if (busListResult) {
			up = busListResult.getNumBusList();
			for (var i = 0, num = busListResult.getNumBusList(); i < num; i++) {
				var item = busListResult.getBusListItem(i);
				ha = item.HA;

				//获取每条线路的站点
				busline.getBusLine(item);
			}
			if (up === 0) {
				if (++y >= up) {
					if (z > 999) {
						RelDiTie();
					} else {
						xilou();
					}
				}
			}
			busline.setGetBusLineCompleteCallback(function (lineResults) {
				var jsonObj = lineResults;
				var BusStaions = [];
				for (var i = 0; i < jsonObj.BB.length; i++) {
					BusStaions.push({
						'Name': jsonObj.BB[i].name,
						'Lat': jsonObj.BB[i].position.lat,
						'Lng': jsonObj.BB[i].position.lng,
						'Address': jsonObj.BB[i].hk,
						'ZoneCode': self.currCityCode,
						'AreaId': '',
						'IsChangeStation': 0
					});
				}

				var busLineName = "";
				if (jsonObj.name.indexOf('(') === -1) {
					busLineName = jsonObj.name;
				} else {
					busLineName = jsonObj.name.substring(0, jsonObj.name.indexOf('('));
				}
				self.swEntity.Name = busLineName;
				self.swEntity.BaiduName = jsonObj.name;
				self.swEntity.Nos = z > 999 ? dt : z;
				self.swEntity.LineType = lineType;
				self.swEntity.Stations = BusStaions;
				self.swEntity.ZoneCode = self.currCityCode;

				self.list.push(self.swEntity);

				self.site += BusStaions;
				self.route += "路线：" + jsonObj.name + "<br/>";
				$(".route").html(self.route);
				//$(".site").text(self.site);

				console.log("result:" + busLineName);

				subWaysAdd(state);

				if (++y >= up) {
					if (z > 999) {
						RelDiTie();
					} else {
						xilou();
					}
				}
			});
		}
	}
});

function busSearch(name) {
	busName = name;
	busline.getBusList(busName);
}

self.Add = function () {
	DelSubWayStationRel();



	//for (var i = 0; i < 30; i++) {
	// var dt = "地铁" + i.toString();
	// busSearch(dt);
	//}
}

function xilou() {
	z += 1;
	if (z > 999) {
		alert("公交采集完毕，确定后采集地铁。");
		RelDiTie();
		//return;
	} else {
		busSearch(self.currCityName + z.toString());
		// setTimeout(xilou, 15000);
	}
}

function RelDiTie() {
	dt += 1;
	if (dt > 10) {
		alert("地铁采集完毕");
	} else {
		lineType = 1;
		var dtName = self.currCityName + "地铁" + dt.toString();
		busSearch(dtName);
	}
}

function DelSubWayStationRel() {
	var url = "/CollectBus/DelSubWayStationRelations";


	$http.post(url, {
		cityCode: self.currCityCode
	}).success(function (data, status, headers, config) {
		if (data) {
			alert("关系已清除,确定后开始采集新数据");
			xilou();
		}
	}).error(function (data, status, headers, config) {
		layer.alert("服务器错误，请联系管理员");
	});
}

//将获取的信息保存到数据库
function subWaysAdd(state) {
	var url = "/CollectBus/SubWaysAdd";

	$.ajax({
		url: url,
		type: 'post',
		async: false, //使用同步的方式,true为异步方式
		data: {
			sw: self.swEntity,
			lineType: self.swEntity.LineType,
			cityCode: self.currCityCode
		}, //这里使用json对象
		success: function (data) {
			result = data.result;
			self.swEntity = {};
			state = true;
		},
		fail: function () {

		}
	});
}

//通过循环执行定时器，解决采集异常后程序终止问题，每隔5分钟检查一次
window.setInterval(function () {
	if (!state) {
		var yuxinsu = z;
		var timeout = window.setTimeout(function () {
			if (yuxinsu == z && z < 999) {
				xilou();
			}
			window.clearTimeout(timeout);
		}, 60000);
	}
}, 300000);
