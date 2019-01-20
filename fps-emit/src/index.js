import {PerformanceMetadataMarker} from "performance-mark-metadata";
import FpsEmitter from "fps-emitter";

const marker = new PerformanceMetadataMarker();
window.marker = marker;

const fps = new FpsEmitter();
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

window.getFpsStats = getFpsStats;

export default getFpsStats