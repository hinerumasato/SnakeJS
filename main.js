Array.prototype.last = function () {
    return this[this.length - 1];
}

$(document).ready(function () {
    const CANVAS_WIDTH = 600;
    const CANVAS_HEIGHT = 600;
    const SPRITE_WIDTH = 30;
    const SPRITE_HEIGHT = 15;
    const FPS = 60;
    const INTERVAL = 1000 / FPS;
    const canvas = document.querySelector('canvas');

    const Sprites = {
        APPLE: './img/apple.png',

        BODY_HORIZONTAL: './img/body_horizontal.png',
        BODY_VERTICAL: './img/body_vertical.png',

        BODY_BOTTOMLEFT: './img/body_bottomleft.png',
        BODY_BOTTOMRIGHT: './img/body_bottomright.png',
        BODY_TOPLEFT: './img/body_topleft.png',
        BODY_TOPRIGHT: './img/body_topright.png',

        HEAD_DOWN: './img/head_down.png',
        HEAD_UP: './img/head_up.png',
        HEAD_LEFT: './img/head_left.png',
        HEAD_RIGHT: './img/head_right.png',

        TAIL_DOWN: './img/tail_down.png',
        TAIL_UP: './img/tail_up.png',
        TAIL_LEFT: './img/tail_left.png',
        TAIL_RIGHT: './img/tail_right.png',
    }

    const Constants = {
        INIT_LENGTH: 3 // Chiều dài ban đầu của rắn
    }

    /**
     * Lớp Util cung cấp các phương thức chức năng chung để tái sử dụng trong quá trình phát triển
     */
    class Util {
        /**
         * phương thức nhận vào url của image trên máy tính hoặc trình duyệt, sau đó trả ra đối tượng
         * blob của ảnh
         * @param {string} imageURL 
         * @returns {Promise<Blob>} đối tượng blob của ảnh
         */
        static async createImageBlob(imageURL) {
            const response = await fetch(imageURL);
            const blob = await response.blob();
            return blob;
        }
    }

    /**
     * Class dùng để lưu trữ sẵn đối tượng bitmap để không phải đọc file nhiều lần làm giảm hiệu năng thực thi
     */
    class ImageBitmapHolder {
        static instance;
        constructor() {
            this.bitmapObj = {}
            this.loadBitmaps();
        }


        /**
         * Tải tất cả các sprite và biến nó thành đối tượng bitmap
         */
        async loadBitmaps() {
            this.bitmapObj = {
                [Sprites.APPLE]: await createImageBitmap(await Util.createImageBlob(Sprites.APPLE)),
                [Sprites.BODY_HORIZONTAL]: await createImageBitmap(await Util.createImageBlob(Sprites.BODY_HORIZONTAL)),
                [Sprites.BODY_VERTICAL]: await createImageBitmap(await Util.createImageBlob(Sprites.BODY_VERTICAL)),
                [Sprites.BODY_BOTTOMLEFT]: await createImageBitmap(await Util.createImageBlob(Sprites.BODY_BOTTOMLEFT)),
                [Sprites.BODY_BOTTOMRIGHT]: await createImageBitmap(await Util.createImageBlob(Sprites.BODY_BOTTOMRIGHT)),
                [Sprites.BODY_TOPLEFT]: await createImageBitmap(await Util.createImageBlob(Sprites.BODY_TOPLEFT)),
                [Sprites.BODY_TOPRIGHT]: await createImageBitmap(await Util.createImageBlob(Sprites.BODY_TOPRIGHT)),
                [Sprites.HEAD_DOWN]: await createImageBitmap(await Util.createImageBlob(Sprites.HEAD_DOWN)),
                [Sprites.HEAD_UP]: await createImageBitmap(await Util.createImageBlob(Sprites.HEAD_UP)),
                [Sprites.HEAD_LEFT]: await createImageBitmap(await Util.createImageBlob(Sprites.HEAD_LEFT)),
                [Sprites.HEAD_RIGHT]: await createImageBitmap(await Util.createImageBlob(Sprites.HEAD_RIGHT)),
                [Sprites.TAIL_DOWN]: await createImageBitmap(await Util.createImageBlob(Sprites.TAIL_DOWN)),
                [Sprites.TAIL_UP]: await createImageBitmap(await Util.createImageBlob(Sprites.TAIL_UP)),
                [Sprites.TAIL_LEFT]: await createImageBitmap(await Util.createImageBlob(Sprites.TAIL_LEFT)),
                [Sprites.TAIL_RIGHT]: await createImageBitmap(await Util.createImageBlob(Sprites.TAIL_RIGHT)),
            }
        }

        /**
         * @returns {ImageBitmapHolder}
         */
        static getInstance() {
            if(this.instance == null)
                this.instance = new ImageBitmapHolder();
            return this.instance;
        }

        /**
         * 
         * @param {string} key 
         * @returns {ImageBitmap}
         */
        getBitmap(key) {
            return this.bitmapObj[key];
        }
    }

    /**
     * Đây là abstract class biểu diễn một đối tượng có thể có sprite ảnh để hiển thị lên màn hình
     * @abstract
     */
    class SpriteItem {
        /**
         * @param {string} sprite đường dẫn của sprite ảnh
         */
        constructor(sprite) {
            this.sprite = sprite;
        }


        /**
         * 
         * @param {string} sprite sprite mới muốn cập nhật
         */
        setSprite(sprite) {
            this.sprite = sprite;
        }

        setSpriteWithDirection() { };
    }

    /**
     * Lớp biểu diễn hướng đi hiện tại của rắn, được thiết kế bằng singleton design pattern
     */
    class Direction {
        static TOP = 0;
        static RIGHT = 1;
        static BOTTOM = 2;
        static LEFT = 3;
        static instance = null;
        constructor() {
            this.currentDirection = Direction.RIGHT;
        }

        /**
         * Lớp dùng để thay đổi hướng đi mới của rắn
         * @param {Number} newDirection 
         */
        setDirection(newDirection) {
            this.currentDirection = newDirection;
        }

        /**
         * Phương thức dùng để trả ra instance hiện tại mà không new ra đối tượng mới
         * @returns {Direction} instance của direction sau khi không còn null
         */
        static getInstance() {
            if (this.instance == null) {
                console.log("Init instance");
                this.instance = new Direction();
            }
            return this.instance;
        }
    }

    /**
     * Lớp Point dùng để biểu diễn toạ độ của từng đối tượng trong game
     */
    class Point {
        /**
         * @param {Number} x chiều ngang tính từ góc trái trên màn hình
         * @param {Number} y chiều dọc tính từ góc trái trên màn hình
         */
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }

        toString() {
            return "Point: " + this.x + " " + this.y;
        }
    }

    /**
     * Lớp Cell là lớp đại hiện cho 1 phần tử cụ thể trong mảng Cell trong đối tượng Snake, lớp này bao
     * gồm 2 thuộc tính là Point và sprite
     */
    class Cell extends SpriteItem {
        /**
         * @param {Point} point Toạ độ của tế bào
         * @param {string} sprite hình ảnh hiển thị của tế bào
         */
        constructor(point, sprite) {
            super(sprite)
            this.point = point;
        }
    }

    /**
     * Lớp đại diện cho con rắn mà người chơi điều khiển
     */
    class Snake {
        /**
         * @param {Number} length chiều dài rắn
         * @param {Array<Cell>} cells mảng chứa đối tượng Cell biểu diễn đối tượng rắn chứa các tế bào từ đầu đến đuôi
         */
        constructor(length, cells) {
            this.length = length;
            this.cells = cells;
        }


        /**
         * Phương thức khởi tạo trạng thái ban đầu của rắn và trả về đối tượng Snake
         * Thông tin trạng thái đầu tiên: 
         * + Đầu ở vị trí 2, 0
         * + Rắn đi qua phải
         * @returns {Snake} đối tượng snake mới được khởi tạo
         */
        static createNewSnake() {
            const cells = [];
            const snakeLength = Constants.INIT_LENGTH;
            // Tạo đầu rắn
            const head = new Cell(new Point(2, 0), Sprites.HEAD_RIGHT);
            cells.push(head);
            for (let i = 1; i < snakeLength; i++) {
                const body = new Cell(new Point(snakeLength - i - 1, 0), Sprites.BODY_HORIZONTAL)
                cells.push(body);
            }
            const tail = cells.last();
            tail.setSprite(Sprites.TAIL_LEFT);

            const snake = new Snake(snakeLength, cells);
            return snake;
        }

        /**
         * Lấy ra tế bào tại vị trí thứ i
         * @param {Number} i 
         * @returns {Cell}
         */
        getCellAt(i) {
            if (i >= 0 && i < this.cells.length)
                return this.cells[i];
            else throw Error('Index bound exception when get cell at position ' + i);
        }

        grow() {
            this.length++;
            // Cập nhật tail mới và đổi sprite tail cũ thành thân
        }

        move(direction) {
            const head = this.cells[0];
            const oldPoint = head.point;
            let newPoint = null;
            switch (direction) {
                case Direction.RIGHT:
                    let dx = 1
                    let oldX = oldPoint.x;
                    let newX = (oldPoint.x + dx) * SPRITE_WIDTH > (CANVAS_WIDTH - 310) ? 0 : oldX + dx;
                    newPoint = new Point(newX, oldPoint.y);
                    break;

                default:
                    break;
            }

            // Tạo một bản sao của mảng cells
            let newCells = this.cells.slice();
            // Cập nhật vị trí của đầu
            newCells[0] = { ...head, point: newPoint };
            // Cập nhật vị trí của các ô còn lại
            for (let i = 1; i < this.cells.length; i++) {
                newCells[i] = { ...this.cells[i], point: this.cells[i - 1].point };
            }

            // Cập nhật mảng cells
            this.cells = newCells;
        }
    }

    /**
     * Lớp dùng để biểu diễn mồi trong game
     */
    class Bait extends SpriteItem {
        /**
         * @param {Point} point toạ độ của mồi
         */
        constructor(point) {
            this.point = point;
            super(Sprites.APPLE);
        }
    }

    /**
     * Lớp chịu trách nhiệm điều khiển chung trong trò chơi, đồng thời điểu khiển các thành phần khác
     * trong quá trình chơi
     */
    class Game {
        constructor() {
            this.width = CANVAS_WIDTH;
            this.height = CANVAS_HEIGHT;
            this.snake = null;
            this.direction = null;
            this.imageBitmapHolder = null;
        }

        init() {
            this.snake = Snake.createNewSnake();
            this.direction = Direction.getInstance();
            this.imageBitmapHolder = ImageBitmapHolder.getInstance();
        }

        /**
         * @param {HTMLCanvasElement} canvas 
         * Phương thức nhận vào một canvas element, sau đó lần lượt vẽ rắn, mồi trên phần tử canvas đó
         */
        async drawComponents(canvas) {
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            this.snake.cells.forEach(async cell => {
                const imageBitmap = this.imageBitmapHolder.getBitmap(cell.sprite);
                context.drawImage(imageBitmap, cell.point.x * SPRITE_WIDTH, cell.point.y * SPRITE_HEIGHT, SPRITE_WIDTH, SPRITE_HEIGHT);
            });
        }

        update() {
            setInterval(() => {
                this.drawComponents(canvas);
            }, INTERVAL);

            setInterval(() => {
                this.snake.move(Direction.RIGHT);
            }, 100)
        }

        start() {
            this.init();
            this.update();
        }
    }

    new Game().start();
});