import { useEffect, useSyncExternalStore } from "react";
import type { ProfileModel } from "../business/profile-model";

export function useProfileViewModel(model: ProfileModel) {
  const state = useSyncExternalStore(model.subscribe, model.getSnapshot);
  useEffect(() => { void model.load(); return () => model.reset(); }, [model]);
  return { state, retry: () => { void model.load(); } };
}
