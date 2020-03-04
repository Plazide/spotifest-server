const fetchMetaInfo = require("../util/fetchMetaInfo");
const playbackHandler = require("./playbackHandler");
const removeTracks = require("../util/removeTracks");

async function spotifyHandler (party){
	console.log("Starting Spotify handler...");
	const defaultWait = 1000 * 30;

	const handler = async () => {
		try{
			const{
				listId,
				duration,
				progress,
				isPlaying,
				currentPlaylist,
				id,
				deviceId,
				playbackActive
			} = await fetchMetaInfo(party);
			const remaining = duration - progress;

			await removeTracks(party, { currentPlaylist, id });
			await playbackHandler(party, {
				isPlaying,
				remaining,
				progress,
				listId,
				currentPlaylist,
				deviceId,
				playbackActive
			});

			const wait = isPlaying ? (remaining + 1000 || defaultWait) : defaultWait;
			console.log("\n⏰  Waiting", wait / 1000, "seconds\n");
			setTimeout(handler, wait);
		}catch(err){
			console.error("An error occurred", err);

			if(err.statusCode === 401 || err.statusCode === 403){
				const success = await party.refresh();
				if(success)
					spotifyHandler(party);
				else
					throw Error("Could not refresh access token");
			}
		}
	};

	const init = async () => {
		const reqs = [
			party.setShuffle({ state: false }),
			party.setRepeat({ state: "off" })
		];

		await Promise.all(reqs).catch( err => {
			console.warn("Cannot set shuffle or repeat.", err);
		});
	};

	await init();
	handler();
}

module.exports = spotifyHandler;
