Array.prototype.last = function () {
    return this[this.length - 1];
}

$(document).ready(function () {
    const CANVAS_WIDTH = 350;
    const CANVAS_HEIGHT = 150;
    const SPRITE_WIDTH = 30;
    const SPRITE_HEIGHT = 15;
    const MOVE_INTERVAL = 10;
    const FPS = 60;
    const INTERVAL = 1000 / FPS;
    const canvas = document.querySelector('canvas');
    let moveCounter = 0;

    const Sprites = {
        APPLE: './img/apple.png',
        BRICK: './img/brick.png',

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
        INIT_LENGTH: 3, // Chiều dài ban đầu của rắn
        VELOCITY: 0.5, // Tốc độ của rắn
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

        /**
         * Phương thức dùng để random ngẫu nhiên từ 0 -> bound
         * @param {Number} bound 
         * @returns {Number} số được random
         */
        static randomNumber(bound) {
            return Math.floor(Math.random() * bound);
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
                [Sprites.BRICK]: await createImageBitmap(await Util.createImageBlob(Sprites.BRICK)),
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
            if (this.instance == null)
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
         * @param {Point} point Vị trí hiển thị trên màn hình
         * @param {string} sprite đường dẫn của sprite ảnh
         */
        constructor(point, sprite) {
            this.sprite = sprite;
            this.point = point;
        }


        /**
         * 
         * @param {string} sprite sprite mới muốn cập nhật
         */
        setSprite(sprite) {
            this.sprite = sprite;
        }

        setSpriteWithDirection() { };

        /**
         * 
         * @param {Point} point Toạ độ mới
         */
        setPoint(point) {
            this.point = point;
        }
    }


    /**
     * Lớp chịu trách nhiệm xử lý va chạm của các đối tượng sprite item
     */
    class Collision {
        /**
         * 
         * @param {Array<SpriteItem>} items1 
         * @param {Array<SpriteItem>} items2 
         * @param {Function} doIfCollision Thực hiện sau khi va chạm
         */
        static check(items1, items2, doIfCollision) {
            for (const item1 of items1) {
                const point = item1.point;
                for (const item2 of items2) {
                    if(point.equal(item2.point)) {
                        doIfCollision();
                        return; // Thoát khỏi phương thức check ngay lập tức sau khi phát hiện va chạm
                    }
                }
            }
        }
    }

    /**
     * Lớp biểu diễn hướng đi hiện tại của rắn, được thiết kế bằng singleton design pattern
     */
    class Direction {
        static UP = 0;
        static RIGHT = 1;
        static DOWN = 2;
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

        /**
         * Phương thức nhận vào hướng di chuyển và địa điểm hiện tại, tuỳ vào hướng di chuyển
         * sẽ tính toán ra địa điểm tiếp theo cho rắn, nếu địa điểm tiếp theo có x hoặc y đi ra khỏi 
         * viền của canvas thì thiết lập toạ độ tiếp theo sẽ là đầu hoặc cuối map
         * @param {Number} direction hướng di chuyển để tính địa điểm tiếp theo
         * @param {Point} oldPoint vị trí cũ (vị trí hiện tại đang đứng)
         * @returns {Point} địa điểm tiếp theo rắn cần đi tới
         */
        static computeNextPoint(direction, oldPoint) {
            let newX = 0;
            let newY = 0;
            let oldX = oldPoint.x;
            let oldY = oldPoint.y;
            switch (direction) {
                case Direction.RIGHT:
                    newX = (oldX + 3) * SPRITE_WIDTH > CANVAS_WIDTH ? 0 : oldX + 1;
                    newY = oldPoint.y;
                    break;
                case Direction.DOWN:
                    newX = oldPoint.x;
                    newY = (oldY + 1) * SPRITE_HEIGHT > CANVAS_HEIGHT ? 0 : oldY + 1;
                    break;
                case Direction.LEFT:
                    newX = (oldX - 1) * SPRITE_WIDTH < 0 ? SPRITE_WIDTH : oldX - 1;
                    newY = oldPoint.y;
                    break;
                case Direction.UP:
                    newX = oldX;
                    newY = (oldY - 1) * SPRITE_HEIGHT < 0 ? SPRITE_HEIGHT : oldY - 1;
                    break;
                default:
                    break;
            }

            const newPoint = new Point(newX, newY);
            return newPoint
        }

        /**
         * Phương thức nhận vào giá trị đầu và cuối khi di chuyển, phương thức này sẽ
         * tính toán các điểm trung gian dựa trên tỷ lệ phần trăm giữa hai điểm
         * Ví dụ rắn di chuyển (1, 0) -> (2, 0) và v = 0.1 thì sẽ đi 1.1, 1.2, 1.3 ... 2
         * @param {Point} start vị trí bắt đầu
         * @param {Point} end vị trí kết thúc
         * @param {Number} v vận tốc
         * @returns {Point} vị trí sau khi lerp
         */
        static lerpPoint(start, end, v) {
            let xStart = start.x;
            let yStart = start.y;
            let xEnd = end.x;
            let yEnd = end.y;

            let xLerp = xStart + v * (xEnd - xStart);
            let yLerp = yStart + v * (yEnd - yStart);

            if (xEnd <= 0) xLerp = xEnd;
            if (xEnd >= CANVAS_WIDTH) xLerp = xEnd;

            return new Point(xLerp, yLerp);
        }

        /**
         * 
         * @param {Number} start 
         * @param {Number} end 
         * @param {Number} v 
         */
        static lerp(start, end, v) {
            return start + v * (end - start);
        }

        /**
         * 
         * @param {Point} that
         * @returns {boolean}
         */
        equal(that) {
            return this.x == that.x && this.y == that.y;
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
            super(point, sprite)
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
         * + Rắn đi qua phải
         * + Vì rắn đi qua phải, ta cần tạo đầu rắn ở vị trí cells[0] là x = length - 1
         * + Các vị trí thân đến đuôi (cells[1] -> cells[length-1]) 
         * sẽ dùng vòng lặp bắt đầu từ x = length - 2 đổ về x = 0
         * + Vị trí y = 0 cho tất cả các tế bào
         * @returns {Snake} đối tượng snake mới được khởi tạo
         */
        static createNewSnake() {
            const cells = [];
            const snakeLength = Constants.INIT_LENGTH;
            // Tạo đầu rắn
            let firstX = snakeLength - 1;
            let firstY = 0;
            const head = new Cell(new Point(firstX, firstY), Sprites.HEAD_RIGHT);
            cells.push(head);

            // Tạo thân rắn
            for (let i = 1; i < snakeLength; i++) {
                let bodyX = snakeLength - i - 1;
                let bodyY = 0;
                const body = new Cell(new Point(bodyX, bodyY), Sprites.BODY_HORIZONTAL)
                cells.push(body);
            }

            // Thiết lập tế bào cuối cùng là đuôi rắn nếu độ dài khởi điểm lớn hơn 1
            if (snakeLength > 1) {
                const tail = cells.last();
                tail.setSprite(Sprites.TAIL_LEFT);
            }

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
            const newCells = new Cell(new Point(0, 0), null);
            this.cells.push(newCells);
        }

        /**
         * Phương thức dùng để di chuyển thân theo đầu rắn, cụ thể:
         * + Trước khi di chuyển đầu rắn ta di chuyển cơ thể rắn bằng chạy vòng lặp i từ length - 1 -> 1
         * + Trong vòng lặp thực hiện câu lệnh cells[i] = cells[i-1]
        */
        moveBody() {
            let newCells = [...this.cells];
            for (let i = this.length - 1; i > 0; i--) {
                let cell = newCells[i];
                const beforeCell = newCells[i - 1];
                const beforeCellPoint = beforeCell.point;
                const newPoint = beforeCellPoint;
                cell = new Cell(newPoint, beforeCell.sprite);
                newCells[i] = cell;
            }
            // Cập nhật mảng cells với mảng mới
            this.cells = newCells;
            this.cells[1].sprite = Sprites.BODY_HORIZONTAL;
            this.cells.last().sprite = Sprites.TAIL_LEFT;
        }


        /**
         * Phương thức dùng để di chuyển rắn, bao gồm cả việc di chuyển thân và di chuyển đầu
         * @param {Number} direction hướng di chuyển
        */
        move(direction) {
            this.moveBody();
            this.changeSprites(direction);
            // Di chuyển đầu
            let head = this.cells[0];
            const newPoint = Point.computeNextPoint(direction, new Point(head.point.x, head.point.y));
            head.point = newPoint;
            head = new Cell(newPoint, this.cells[0].sprite);
        }

        /**
         * Phương thức dùng để thay đổi sprite của rắn dựa vào hướng di chuyển
         * @param {Number} direction hướng di chuyển
         */
        changeSprites(direction) {
            const head = this.cells[0];
            const tail = this.cells.last();
            switch (direction) {
                case Direction.RIGHT:
                    head.setSprite(Sprites.HEAD_RIGHT);
                    this.cells[1].setSprite(Sprites.BODY_HORIZONTAL);
                    break;
                case Direction.DOWN:
                    head.setSprite(Sprites.HEAD_DOWN);
                    this.cells[1].setSprite(Sprites.BODY_VERTICAL);
                    break;
                case Direction.LEFT:
                    head.setSprite(Sprites.HEAD_LEFT);
                    this.cells[1].setSprite(Sprites.BODY_HORIZONTAL);
                    break;
                case Direction.UP:
                    head.setSprite(Sprites.HEAD_UP);
                    this.cells[1].setSprite(Sprites.BODY_VERTICAL);
                    break;
                default:
                    break;
            }
        }
    }

    /**
     * Lớp dùng để biểu diễn mồi trong game
     */
    class Bait extends SpriteItem {
        constructor(point) {
            super(point, Sprites.APPLE);
        }
    }

    /**
     * Lớp dùng để biểu diễn viên gạch (vật cản) trong game
     */
    class Brick extends SpriteItem {
        constructor(point) {
            super(point, Sprites.BRICK);
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
            this.bait = null;
            this.direction = null;
            this.imageBitmapHolder = null;
        }

        init() {
            this.snake = Snake.createNewSnake();
            this.bait = new Bait(new Point(6, 3));
            this.direction = Direction.getInstance();
            this.imageBitmapHolder = ImageBitmapHolder.getInstance();
        }

        /**
         * @param {HTMLCanvasElement} canvas 
         * Phương thức nhận vào một canvas element, sau đó lần lượt vẽ rắn, mồi trên phần tử canvas đó
         */
        drawComponents(canvas) {
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // // Vẽ background
            // const background = new Image(CANVAS_WIDTH, CANVAS_HEIGHT);
            // background.src = 'https://th.bing.com/th/id/R.37716068933bae2f9b11ff90bc91b015?rik=tVu8QIDEj35%2ffQ&pid=ImgRaw&r=0';
            // context.drawImage(background, 0, 0);
            // Vẽ mồi
            const imageBitmap = this.imageBitmapHolder.getBitmap(this.bait.sprite);
            const point = this.bait.point;
            context.drawImage(imageBitmap, point.x * SPRITE_WIDTH, point.y * SPRITE_HEIGHT, SPRITE_WIDTH, SPRITE_HEIGHT);
            // Vẽ rắn
            this.snake.cells.forEach(cell => {
                const imageBitmap = this.imageBitmapHolder.getBitmap(cell.sprite);
                context.drawImage(imageBitmap, cell.point.x * SPRITE_WIDTH, cell.point.y * SPRITE_HEIGHT, SPRITE_WIDTH, SPRITE_HEIGHT);
            });

        }

        update() {
            setInterval(() => {
                moveCounter++;
                if (moveCounter >= (60 / MOVE_INTERVAL)) {
                    this.snake.move(this.direction.currentDirection);
                    Collision.check([this.snake.cells[0]], [this.bait], () => {
                        this.snake.grow();
                        
                        const baitX = Util.randomNumber(10);
                        const baitY = Util.randomNumber(10);
                        console.log({baitX, baitY});
                        const newBaitPoint = new Point(baitX, baitY);
                        this.bait.point = newBaitPoint;
                    });

                    const snakeBody = this.snake.cells.filter((cell, index) => index > 0);
                    Collision.check([this.snake.cells[0]], snakeBody, () => {
                        alert('GAME OVER');
                        this.snake.cells = [];
                    });

                    moveCounter = 0;
                }
                this.drawComponents(canvas);
            }, INTERVAL);
        }

        controlListener() {
            const _this = this;
            $(document).on('keydown', function (e) {
                switch (e.key) {
                    case 'ArrowRight':
                        _this.direction.setDirection(Direction.RIGHT);
                        break;
                    case 'ArrowDown':
                        _this.direction.setDirection(Direction.DOWN);
                        break;
                    case 'ArrowLeft':
                        _this.direction.setDirection(Direction.LEFT);
                        break;
                    case 'ArrowUp':
                        _this.direction.setDirection(Direction.UP);
                    default:
                        break;
                }
            });
        }

        handleEvents() {
            this.controlListener();
        }

        start() {
            this.init();
            this.update();
            this.handleEvents();
        }
    }

    new Game().start();
});