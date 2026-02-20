import { useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';
import Konva from 'konva';
import { useDesignStore } from '../../store/useDesignStore';
import { useHistoryStore } from '../../store/useHistoryStore';

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>;
}

export default function SelectionTransformer({ stageRef }: Props) {
  const trRef = useRef<Konva.Transformer>(null);
  const selectedId = useDesignStore((s) => s.selectedId);
  const beds = useDesignStore((s) => s.beds);
  const structures = useDesignStore((s) => s.structures);
  const updateBed = useDesignStore((s) => s.updateBed);
  const updateStructure = useDesignStore((s) => s.updateStructure);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);

  const selectedBed = beds.find((b) => b.id === selectedId);
  const selectedStructure = structures.find((s) => s.id === selectedId);

  useEffect(() => {
    const tr = trRef.current;
    if (!tr || !stageRef.current) return;
    const stage = stageRef.current;

    if (!selectedId || (!selectedBed && !selectedStructure)) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }

    const node = stage.findOne(`#${selectedId}`);
    if (node) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedId, selectedBed, selectedStructure, stageRef]);

  const handleTransformStart = () => pushSnapshot();

  const handleTransformEnd = (e: any) => {
    const node = e.target;

    if (selectedBed) {
      node.scaleX(1);
      node.scaleY(1);
      // node.x/y is center-based (offsetX/offsetY set in BedShape), convert to top-left
      updateBed(selectedId!, {
        x: node.x() - selectedBed.width / 2,
        y: node.y() - selectedBed.height / 2,
        rotation: node.rotation(),
      });
      return;
    }

    if (selectedStructure) {
      node.scaleX(1);
      node.scaleY(1);
      updateStructure(selectedId!, { rotation: node.rotation() });
    }
  };

  return (
    <Transformer
      ref={trRef}
      rotateEnabled
      enabledAnchors={[]}
      onTransformStart={handleTransformStart}
      onTransformEnd={handleTransformEnd}
    />
  );
}
