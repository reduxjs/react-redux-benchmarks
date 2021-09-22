// @ts-ignore
import {PerformanceMetadataMarker} from "performance-mark-metadata";
// @ts-ignore
import FpsEmitter from "fps-emitter";

const marker = new PerformanceMetadataMarker();
// @ts-ignore
window.marker = marker;

const fps = new FpsEmitter();
// @ts-ignore
fps.on("update", function(FPS) {
  // mark current FPS
  marker.mark("FPS", {
    details: { FPS }
  });
});

const getFpsStats = () => {
  // fake a final entry with the same FPS
  const finalFPS = fps.__fps
  marker.mark("FPS", {
      details: { FPS : finalFPS, isFinal : true }
  });

  const logData = performance.getEntriesByType("mark").map(entry => {
    const meta = marker.getEntryMetadata(entry);
    return {
      type: entry.name,
      timeStamp: entry.startTime,
      meta: meta
    };
  });

  return logData;
}

// @ts-ignore
window.getFpsStats = getFpsStats;

export default getFpsStats