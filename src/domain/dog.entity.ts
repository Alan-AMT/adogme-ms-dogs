export class Dog {
    private constructor(
        public readonly id: string,
        public readonly shelterId: string,
        public name: string,
        public breed: string,
        public age: number,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }

    public static createDog(dogData: { id: string; name: string; breed: string; age: number; createdAt: Date; updatedAt: Date; shelterId: string }): Dog {
        return new Dog(
            dogData.id,
            dogData.shelterId,
            dogData.name,
            dogData.breed,
            dogData.age,
            dogData.createdAt,
            dogData.updatedAt,
        );
    }

    updateDetails(details: { name?: string; breed?: string; age?: number; }) {
    if (details.name) {this.name = details.name};
    if (details.breed) {this.breed = details.breed};
    if (details.age !== undefined) {
        if (details.age < 0) throw new Error("Edad inválida");
        this.age = details.age;
    }
    
    this.updatedAt = new Date();
  }
}