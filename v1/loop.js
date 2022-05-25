module.exports = async function loop(fun) {
	var index = 0;

	await new Promise(function(reject, resolve) {
		var interval = setInterval(function() {
			index += 1;
			if (fun(index)) {
				clearInterval(interval);
				resolve();
			}
		}, 200);
	}).catch(function(err) {});
}

// loop(function(i) {
// 	return i > 10;
// });