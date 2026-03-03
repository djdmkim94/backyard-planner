import { useRef } from 'react';
import Konva from 'konva';
import Toolbar from './components/layout/Toolbar';
import Sidebar from './components/sidebar/Sidebar';
import StatusBar from './components/layout/StatusBar';
import GardenCanvas from './components/canvas/GardenCanvas';
import PropertiesPanel from './components/sidebar/PropertiesPanel';
import SunQueryTooltip from './components/canvas/SunQueryTooltip';
import { useKeyboard } from './hooks/useKeyboard';

function App() {
  const stageRef = useRef<Konva.Stage>(null);
  useKeyboard();

  return (
    <div className="h-full flex flex-col">
      <Toolbar stageRef={stageRef} />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <GardenCanvas stageRef={stageRef} />
        <div className="w-56 bg-[#1c1c1e] border-l border-white/10 flex flex-col overflow-y-auto shrink-0">
          <div className="p-3">
            <PropertiesPanel />
          </div>
        </div>
      </div>
      <StatusBar />
      <SunQueryTooltip />
    </div>
  );
}

export default App;
