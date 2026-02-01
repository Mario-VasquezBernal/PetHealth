export const speciesProfiles = {
  dog: {
    key: "dog",
    label: "Perro",
    supportsWeightModel: true,
    supportsHealthRisk: true
  },

  cat: {
    key: "cat",
    label: "Gato",
    supportsWeightModel: true,
    supportsHealthRisk: true
  },

  bird: {
    key: "bird",
    label: "Ave",
    supportsWeightModel: false,
    supportsHealthRisk: false
  },

  rabbit: {
    key: "rabbit",
    label: "Conejo",
    supportsWeightModel: false,
    supportsHealthRisk: false
  },

  reptile: {
    key: "reptile",
    label: "Reptil",
    supportsWeightModel: false,
    supportsHealthRisk: false
  },

  other: {
    key: "other",
    label: "Otra mascota",
    supportsWeightModel: false,
    supportsHealthRisk: false
  }
};

export function normalizeSpecies(pet) {
  if (!pet) return "other";

  if (pet.species) return String(pet.species).toLowerCase();

  // compatibilidad temporal
  if (pet.type) {
    const t = String(pet.type).toLowerCase();

    if (t === "perro") return "dog";
    if (t === "gato") return "cat";
  }

  return "other";
}

export function getSpeciesProfile(petOrSpecies) {
  const species =
    typeof petOrSpecies === "string"
      ? petOrSpecies.toLowerCase()
      : normalizeSpecies(petOrSpecies);

  return speciesProfiles[species] || speciesProfiles.other;
}
