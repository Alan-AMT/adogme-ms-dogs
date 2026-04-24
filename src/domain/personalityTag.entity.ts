export enum PersonalityCategory {
    caracter = 'caracter',
    socializacion = 'socializacion',
    actividad = 'actividad',
    entrenamiento = 'entrenamiento',
}

export class PersonalityTag {
    constructor(
        public readonly id: string,
        public readonly dogId: string | null,
        public readonly label: string,
        public readonly category: PersonalityCategory,
        public readonly updatedAt: Date,
        public readonly createdAt: Date,
    ) { }

    public static createPersonalityTag(tagData: { id: string; dogId: string | null; label: string; category: PersonalityCategory; createdAt: Date; updatedAt: Date }): PersonalityTag {
        return new PersonalityTag(
            tagData.id,
            tagData.dogId,
            tagData.label,
            tagData.category,
            tagData.updatedAt,
            tagData.createdAt,
        );
    }
}