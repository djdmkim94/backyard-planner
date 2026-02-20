import { useDesignStore } from '../../store/useDesignStore';
import BedShape from './BedShape';

export default function BedLayer() {
  const beds = useDesignStore((s) => s.beds);
  return (
    <>
      {beds.map((bed) => (
        <BedShape key={bed.id} bed={bed} />
      ))}
    </>
  );
}
