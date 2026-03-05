import { useRef, useState, useEffect } from 'react';
import Konva from 'konva';
import Toolbar from './components/layout/Toolbar';
import Sidebar from './components/sidebar/Sidebar';
import StatusBar from './components/layout/StatusBar';
import ClimatePanel from './components/layout/ClimatePanel';
import TourOverlay from './components/layout/TourOverlay';
import GardenCanvas from './components/canvas/GardenCanvas';
import PropertiesPanel from './components/sidebar/PropertiesPanel';
import SunQueryTooltip from './components/canvas/SunQueryTooltip';
import { useKeyboard } from './hooks/useKeyboard';

const TOUR_KEY = 'garden-tour-seen';

function App() {
  const stageRef = useRef<Konva.Stage>(null);
  const [tourActive, setTourActive] = useState(false);
  useKeyboard();

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) setTourActive(true);
  }, []);

  const startTour = () => setTourActive(true);
  const closeTour = () => {
    localStorage.setItem(TOUR_KEY, '1');
    setTourActive(false);
  };

  return (
    <div className="h-full flex flex-col">
      <Toolbar stageRef={stageRef} onStartTour={startTour} />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div data-tour="canvas" className="flex-1 min-w-0 flex flex-col">
          <GardenCanvas stageRef={stageRef} />
        </div>
        <div className="w-56 bg-[#1c1c1e] border-l border-white/10 flex flex-col overflow-y-auto shrink-0">
          <div className="p-3">
            <PropertiesPanel />
          </div>
        </div>
      </div>
      <ClimatePanel />
      <StatusBar />
      <SunQueryTooltip />
      {tourActive && <TourOverlay onClose={closeTour} />}
    </div>
  );
}

export default App;
