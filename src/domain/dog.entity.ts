export class Dog {
    constructor(
        public id: string,
        public name: string,
        public breed: string,
        public age: number,
        public createdAt: Date,
        public updatedAt: Date,
    ) { }
}