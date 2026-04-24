export class Vaccination {
    constructor(
        public readonly id: string,
        public readonly dogId: string,
        public readonly name: string,
        public readonly date: Date,
        public readonly verified: boolean,
        public readonly updatedAt: Date,
        public readonly createdAt: Date,
        public readonly nextDose: Date | null,
    ) { }

    public static createVaccination(vaccinationData: { id: string; dogId: string; name: string; date: Date; nextDose: Date | null; verified: boolean; createdAt: Date; updatedAt: Date }): Vaccination {
        return new Vaccination(
            vaccinationData.id,
            vaccinationData.dogId,
            vaccinationData.name,
            vaccinationData.date,
            vaccinationData.verified,
            vaccinationData.updatedAt,
            vaccinationData.createdAt,
            vaccinationData.nextDose,
        );
    }
}