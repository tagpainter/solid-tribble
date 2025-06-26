import type { Vec2 } from "./vec2";

export class Matrix {
    public a = 1;

    public b = 0;

    public c = 0;

    public d = 1;

    public tx = 0;

    public ty = 0;

    public constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;
    }

    public static identity() {
        return new Matrix();
    }

    public static projection(width: number, height: number) {
        return new Matrix(2 / width, 0, 0, -2 / height, -1, 1);
    }

    public set(a: number, b: number, c: number, d: number, tx: number, ty: number) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;
    }

    public toArray(transpose = true) {
        if (transpose) {
            // prettier-ignore
            return new Float32Array([
                this.a, this.b, 0,
                this.c, this.d, 0,
                this.tx, this.ty, 1
            ]);
        } else {
            // prettier-ignore
            return new Float32Array([
                this.a, this.c, this.tx,
                this.b, this.d, this.ty,
                0, 0, 1
            ])
        }
    }

    public apply(point: Vec2) {
        const newPoint = { ...point };
        newPoint.x = this.a * point.x + this.c * point.y + this.tx;
        newPoint.y = this.b * point.x + this.d * point.y + this.ty;
        return newPoint;
    }

    public applyInverse(point: Vec2) {
        const newPoint = { ...point };
        const { a, b, d, c, tx, ty } = this;
        const id = 1 / (a * d + c * -b);
        const x = point.x;
        const y = point.y;
        newPoint.x = d * id * x + -c * id * y + (ty * c - tx * d) * id;
        newPoint.y = a * id * y + -b * id * x + (-ty * a + tx * b) * id;
        return newPoint;
    }

    public translate(x: number, y: number): this {
        this.tx += x;
        this.ty += y;
        return this;
    }

    public scale(x: number, y: number): this {
        this.a *= x;
        this.d *= y;
        this.c *= x;
        this.b *= y;
        this.tx *= x;
        this.ty *= y;
        return this;
    }

    public scaleFromOrigin(x: number, y: number, origin: Vec2) {
        return this.translate(-origin.x, -origin.y).scale(x, y).translate(origin.x, origin.y);
    }

    public rotate(angle: number): this {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const a1 = this.a;
        const c1 = this.c;
        const tx1 = this.tx;

        this.a = a1 * cos - this.b * sin;
        this.b = a1 * sin + this.b * cos;
        this.c = c1 * cos - this.d * sin;
        this.d = c1 * sin + this.d * cos;
        this.tx = tx1 * cos - this.ty * sin;
        this.ty = tx1 * sin + this.ty * cos;

        return this;
    }

    public rotateFromOrigin(angle: number, origin: Vec2) {
        return this.translate(-origin.x, -origin.y).rotate(angle).translate(origin.x, origin.y);
    }

    public append(matrix: Matrix): this {
        const a1 = this.a;
        const b1 = this.b;
        const c1 = this.c;
        const d1 = this.d;
        this.a = matrix.a * a1 + matrix.b * c1;
        this.b = matrix.a * b1 + matrix.b * d1;
        this.c = matrix.c * a1 + matrix.d * c1;
        this.d = matrix.c * b1 + matrix.d * d1;
        this.tx = matrix.tx * a1 + matrix.ty * c1 + this.tx;
        this.ty = matrix.tx * b1 + matrix.ty * d1 + this.ty;
        return this;
    }

    public appendFrom(a: Matrix, b: Matrix): this {
        const a1 = a.a;
        const b1 = a.b;
        const c1 = a.c;
        const d1 = a.d;
        const tx = a.tx;
        const ty = a.ty;

        const a2 = b.a;
        const b2 = b.b;
        const c2 = b.c;
        const d2 = b.d;

        this.a = a1 * a2 + b1 * c2;
        this.b = a1 * b2 + b1 * d2;
        this.c = c1 * a2 + d1 * c2;
        this.d = c1 * b2 + d1 * d2;
        this.tx = tx * a2 + ty * c2 + b.tx;
        this.ty = tx * b2 + ty * d2 + b.ty;

        return this;
    }

    public prepend(matrix: Matrix): this {
        const tx1 = this.tx;

        if (matrix.a !== 1 || matrix.b !== 0 || matrix.c !== 0 || matrix.d !== 1) {
            const a1 = this.a;
            const c1 = this.c;

            this.a = a1 * matrix.a + this.b * matrix.c;
            this.b = a1 * matrix.b + this.b * matrix.d;
            this.c = c1 * matrix.a + this.d * matrix.c;
            this.d = c1 * matrix.b + this.d * matrix.d;
        }

        this.tx = tx1 * matrix.a + this.ty * matrix.c + matrix.tx;
        this.ty = tx1 * matrix.b + this.ty * matrix.d + matrix.ty;

        return this;
    }

    public setTransform(
        x: number,
        y: number,
        pivotX: number,
        pivotY: number,
        scaleX: number,
        scaleY: number,
        rotation: number,
        skewX: number,
        skewY: number
    ) {
        this.a = Math.cos(rotation + skewY) * scaleX;
        this.b = Math.sin(rotation + skewY) * scaleX;
        this.c = -Math.sin(rotation - skewX) * scaleY;
        this.d = Math.cos(rotation - skewX) * scaleY;

        this.tx = x - (pivotX * this.a + pivotY * this.c);
        this.ty = y - (pivotX * this.b + pivotY * this.d);

        return this;
    }

    public invert() {
        const a1 = this.a;
        const b1 = this.b;
        const c1 = this.c;
        const d1 = this.d;
        const tx1 = this.tx;
        const n = a1 * d1 - b1 * c1;

        this.a = d1 / n;
        this.b = -b1 / n;
        this.c = -c1 / n;
        this.d = a1 / n;
        this.tx = (c1 * this.ty - d1 * tx1) / n;
        this.ty = -(a1 * this.ty - b1 * tx1) / n;

        return this;
    }

    public isIdentity() {
        return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.tx === 0 && this.ty === 0;
    }

    public identity(): this {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.tx = 0;
        this.ty = 0;
        return this;
    }

    public clone(): Matrix {
        const matrix = new Matrix();
        matrix.a = this.a;
        matrix.b = this.b;
        matrix.c = this.c;
        matrix.d = this.d;
        matrix.tx = this.tx;
        matrix.ty = this.ty;
        return matrix;
    }

    public equals(matrix: Matrix) {
        return (
            matrix.a === this.a && matrix.b === this.b && matrix.c === this.c && matrix.d === this.d && matrix.tx === this.tx && matrix.ty === this.ty
        );
    }
}
