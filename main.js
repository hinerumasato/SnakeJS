Array.prototype.last = function () {
    return this[this.length - 1];
}

$(document).ready(function () {
    const canvas = document.querySelector('canvas');

    const CANVAS_WIDTH = canvas.width;
    const CANVAS_HEIGHT = canvas.height;
    const SPRITE_WIDTH = 50;
    const SPRITE_HEIGHT = 50;
    const ROW = CANVAS_WIDTH / SPRITE_WIDTH;
    const COLUMN = CANVAS_HEIGHT / SPRITE_HEIGHT;
    const MOVE_INTERVAL = 10;
    const FPS = 45;
    const INTERVAL = 1000 / FPS;
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

        GAME_OVER: './img/gameover.jpg',
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

        /**
         * Phương thức dùng để đổi từ sprite đang rẽ góc thành sprite thẳng
         * @param {string} turnSprite 
         * @returns {string} straight sprite
         */
        static mapTurnSpriteToStraightSprite(turnSprite) {
            switch (turnSprite) {
                case Sprites.BODY_BOTTOMLEFT:
                case Sprites.BODY_TOPLEFT:
                    return Sprites.BODY_VERTICAL;
                case Sprites.BODY_BOTTOMRIGHT:
                case Sprites.BODY_TOPRIGHT:
                    return Sprites.BODY_HORIZONTAL;
                default:
                    return null;
            }
        }

        /**
         * Phương thức dùng để mapping từ Direction sang turn sprite
         * @param {Direction} direction 
         * @returns {string}
         */
        static mapDirectionToTurnSprite(direction) {
            const oldDirection = direction.oldDirection;
            const currentDirection = direction.currentDirection;

            if (oldDirection == Direction.LEFT && currentDirection == Direction.DOWN)
                return Sprites.BODY_BOTTOMRIGHT;
            else if (oldDirection == Direction.DOWN && currentDirection == Direction.RIGHT)
                return Sprites.BODY_TOPRIGHT;
            else if (oldDirection == Direction.RIGHT && currentDirection == Direction.UP)
                return Sprites.BODY_TOPLEFT;
            else if (oldDirection == Direction.UP && currentDirection == Direction.LEFT)
                return Sprites.BODY_BOTTOMLEFT;
            else if (oldDirection == Direction.LEFT && currentDirection == Direction.UP)
                return Sprites.BODY_TOPRIGHT;
            else if (oldDirection == Direction.UP && currentDirection == Direction.RIGHT)
                return Sprites.BODY_BOTTOMRIGHT;
            else if (oldDirection == Direction.RIGHT && currentDirection == Direction.DOWN)
                return Sprites.BODY_BOTTOMLEFT;
            else if (oldDirection == Direction.DOWN && currentDirection == Direction.LEFT)
                return Sprites.BODY_TOPLEFT;


            else if (oldDirection == null) {
                switch (currentDirection) {
                    case Direction.LEFT:
                    case Direction.RIGHT:
                        return Sprites.BODY_HORIZONTAL;
                    default:
                        return Sprites.BODY_VERTICAL;
                }
            }
        }

        /**
         * Phương thức dùng để mapping từ direction sang sprite của đuôi rắn tương ứng
         * @param {Direction} direction
         * @returns {string} Sprite của đuôi
         */
        static mapDirectionToTail(direction) {
            const oldDirection = direction.oldDirection;
            const currentDirection = direction.currentDirection;

            if (oldDirection) {
                if ((oldDirection == Direction.LEFT || oldDirection == Direction.RIGHT) && currentDirection == Direction.DOWN)
                    return Sprites.TAIL_UP;
                if ((oldDirection == Direction.LEFT || oldDirection == Direction.RIGHT) && currentDirection == Direction.UP)
                    return Sprites.TAIL_DOWN;
                if ((oldDirection == Direction.UP || oldDirection == Direction.DOWN) && currentDirection == Direction.RIGHT)
                    return Sprites.TAIL_LEFT;
                if ((oldDirection == Direction.UP || oldDirection == Direction.DOWN) && currentDirection == Direction.LEFT)
                    return Sprites.TAIL_RIGHT;
            }
            else return Sprites.TAIL_LEFT;
        }

        /**
         * Phương thức dùng để mapping từ lớp direction sang body vertical hoặc horizontal tương ứng
         * @param {Direction} direction 
         * @returns {String} body vertial hoặc horizontal cho rắn
         */
        static mapDirectionToBody(direction) {
            switch (direction.currentDirection) {
                case Direction.LEFT:
                case Direction.RIGHT:
                    return Sprites.BODY_HORIZONTAL
                default:
                    return Sprites.BODY_VERTICAL
            }
        }
    }

    /**
     * Class dùng để lưu trữ sẵn đối tượng bitmap để không phải đọc file nhiều lần 
     * làm tăng hiệu năng thực thi
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
                [Sprites.GAME_OVER]: await createImageBitmap(await Util.createImageBlob(Sprites.GAME_OVER)),
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
         * @param {Function} doIfCollision gọi phương thức doIfCollision sau khi va chạm
         */
        static check(items1, items2, doIfCollision) {
            for (const item1 of items1) {
                const point = item1.point;
                for (const item2 of items2) {
                    if (point.equal(item2.point)) {
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
            this.oldDirection = null;
        }

        /**
         * Lớp dùng để thay đổi hướng đi mới của rắn
         * @param {Number} newDirection 
         */
        setDirection(newDirection) {
            this.oldDirection = this.currentDirection;
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
                    newX = oldX + 1 >= COLUMN ? 0 : oldX + 1;
                    newY = oldPoint.y;
                    break;
                case Direction.DOWN:
                    newX = oldPoint.x;
                    newY = oldY + 1 >= ROW ? 0 : oldY + 1;
                    break;
                case Direction.LEFT:
                    newX = oldX - 1 < 0 ? COLUMN - 1 : oldX - 1;
                    newY = oldPoint.y;
                    break;
                case Direction.UP:
                    newX = oldX;
                    newY = oldY - 1 < 0 ? ROW - 1 : oldY - 1;
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
         * PHƯƠNG THỨC NÀY CÒN ĐANG TRONG QUÁ TRÌNH THỬ NGHIỆM
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
         * * PHƯƠNG THỨC NÀY CÒN ĐANG TRONG QUÁ TRÌNH THỬ NGHIỆM
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
     * Tạo một mục điểm quay đầu mới.
     *
     * @class TurnPointItem
     * @constructor
     * @param {Point} point - Vị trí của điểm quay đầu.
     * @param {string} sprite - Tên sprite liên quan đến điểm quay đầu.
     */
    class TurnPointItem {
        constructor(point, sprite) {
            /**
             * Vị trí của điểm quay đầu.
             * @type {Point}
             */
            this.point = point;

            /**
             * Tên sprite liên quan đến điểm quay đầu.
             * @type {string}
             */
            this.sprite = sprite;
        }
    }

    /**
     * Lưu trữ các item TurnPointItem và là một instance được tạo ra từ singleton
     * design pattern
     */
    class TurnPointHolder {
        /**
         * @type {TurnPointHolder}
         * @static
         */
        static instance = null;
        constructor() {
            /**
             * @type {Array<TurnPointItem>}
             */
            this.turnPointItems = [];
        }

        /**
         * 
         * @returns {TurnPointHolder} instance
         */
        static getInstance() {
            if (this.instance == null)
                this.instance = new TurnPointHolder();
            return this.instance;
        }
        /**
         * Phương thức dùng để lưu một turn point item mới vào mảng items
         * @param {TurnPointItem} turnPointItem 
         */
        store(turnPointItem) {
            this.turnPointItems.push(turnPointItem);
        }

        remove() {
            this.turnPointItems.pop();
        }

        /**
         * Xoá item khi đưa vào một point chỉ định
         * @param {Point} point 
         */
        removeByPoint(point) {
            const result = [];
            for (let item of this.turnPointItems) {
                if (!item.point.equal(point)) {
                    result.push(item);
                }
            }
            this.turnPointItems = result;
        }

        /**
         * Phương thức dùng để kiểm tra có tồn tại một điểm trong Holder hay không
         * @param {Point} point 
         * @returns {Boolean} trả về true nếu point có tồn tải trong mảng items và ngược lại
         */
        isContainPoint(point) {
            for (let item of this.turnPointItems) {
                if (item.point.equal(point))
                    return true;
            }
            return false;
        }

        /**
         * 
         * @param {Point} point 
         * @returns {TurnPointItem|null}
         */
        getItemByPoint(point) {
            for (let item of this.turnPointItems) {
                if (item.point.equal(point))
                    return item;
            }
            return null;
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
            const newCells = new Cell(new Point(-1, -1), null);
            this.cells.push(newCells);
        }

        /**
         * Phương thức dùng để di chuyển thân theo đầu rắn, cụ thể:
         * + Trước khi di chuyển đầu rắn ta di chuyển cơ thể rắn bằng chạy vòng lặp i từ length - 1 -> 1
         * + Trong vòng lặp thực hiện câu lệnh cells[i] = cells[i-1] 
         * nhằm để copy toàn bộ dữ liệu của cells[i-1] vào cells[i] bao gôm point và sprite nằm trong cell
         * + Sau đó kiểm tra tại các vị trí mà con rắn đang chiếm, có điểm nào nằm trong turnPointHolder
         * hay không, nếu tồn tại thì tiến hành đổi sprite lại thành sprite rẽ hướng (BODY_BOTTOMLEFT, ...)
         * + Cuối cùng tiến hành kiểm tra nếu đuôi rắn tức là cells[length - 1] mà đã đi qua điểm
         * nằm trong Holder thì tiến hành xoá TurnPointItem trong Holder đó
        */
        moveBody() {
            const turnPointHolder = TurnPointHolder.getInstance();
            const newCells = [...this.cells];
            for (let i = this.length - 1; i > 0; i--) {
                let cell = newCells[i];
                const beforeCell = newCells[i - 1];
                const beforeCellPoint = beforeCell.point;
                const newPoint = beforeCellPoint;
                const beforeCellSprite = beforeCell.sprite;

                // Kiểm tra đuôi đi qua
                if (i == this.length - 1 && turnPointHolder.isContainPoint(cell.point)) {
                    turnPointHolder.removeByPoint(cell.point);
                    cell = new Cell(newPoint, Util.mapDirectionToTail(Direction.getInstance()));
                }

                // Kiểm tra body rắn có nằm trong holder hay không
                if (turnPointHolder.isContainPoint(newPoint) && i != 1) {
                    const item = turnPointHolder.getItemByPoint(newPoint);
                    cell = new Cell(newPoint, item.sprite);
                } else cell = new Cell(newPoint, beforeCellSprite);

                newCells[i] = cell;
            }
            // Cập nhật mảng cells với mảng mới
            this.cells = newCells;

            /* Cập nhật lại vị trí "cổ rắn" cells[1] nếu không nằm trong holder thì đổi lại
                thành body tương ứng (BODY_VERTICAL, BODY_HORIZONTAL)*/
            if (!turnPointHolder.isContainPoint(this.cells[1].point))
                this.cells[1].sprite = Util.mapDirectionToBody(Direction.getInstance());
        }



        /**
         * Phương thức dùng để di chuyển rắn, bao gồm cả việc di chuyển thân và di chuyển đầu
         * @param {Number} direction hướng di chuyển
        */
        move(direction) {
            this.moveBody();
            let head = this.cells[0];
            const newPoint = Point.computeNextPoint(direction, new Point(head.point.x, head.point.y));
            head.point = newPoint;
            head = new Cell(newPoint, this.cells[0].sprite);
            this.changeSprites(Direction.getInstance());
        }

        /**
         * Phương thức dùng để thay đổi sprite của rắn dựa vào hướng di chuyển
         * @param {Direction} direction hướng di chuyển
         */
        changeSprites(direction) {
            const head = this.cells[0];
            const currentDirection = direction.currentDirection;
            switch (currentDirection) {
                case Direction.RIGHT:
                    head.setSprite(Sprites.HEAD_RIGHT);
                    break;
                case Direction.DOWN:
                    head.setSprite(Sprites.HEAD_DOWN);
                    break;
                case Direction.LEFT:
                    head.setSprite(Sprites.HEAD_LEFT);
                    break;
                case Direction.UP:
                    head.setSprite(Sprites.HEAD_UP);
                    break;
                default:
                    break;

            }
            // this.cells.last().sprite = Util.mapDirectionToTail(direction);
        }
    }

    /**
     * Lớp dùng để biểu diễn mồi trong game
     */
    class Bait extends SpriteItem {
        constructor(point) {
            super(point, Sprites.APPLE);
        }

        /**
         * Tạo đối tượng Bait mới cho game
         * @returns {Bait}
         */
        static createNewBait() {
            const x = Util.randomNumber(COLUMN);
            const y = Util.randomNumber(ROW)
            const point = new Point(x, y);
            return new Bait(point);
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
     * @abstract
     * @class
     * Lớp GameCreator có abstract method là createGame để tạo game theo level
     */
    class GameCreator {
        constructor() {
            /**
             * @type {Snake}
             */
            this.snake = null;
            /**
             * @type {Bait}
             */
            this.bait = null;
            /**
             * @type {Array<Brick>}
             */
            this.bricks = null;
        }
        /**
         * @abstract
         */
        createGame() { throw Error('Abstract Unimplement Method') }

        /**
         * 
         * @returns {Snake}
         */
        getSnake() {
            return this.snake;
        }

        /**
         * 
         * @returns {Bait}
         */
        getBait() {
            return this.bait;
        }

        /**
         * 
         * @returns {Array<Brick>}
         */
        getBricks() {
            return this.bricks;
        }
    }

    /**
     * Level 1 chỉ cần tạo rắn và tạo mồi, rắn di chuyển xuyên map
     */
    class FirstLevelCreator extends GameCreator {
        /**
         * @override
         */
        createGame() {
            this.snake = Snake.createNewSnake();
            this.bait = Bait.createNewBait();
        }

    }

    /**
     * Level 2 cần tạo các viên gạch bao xung quanh game
     */
    class SecondLevelCreator extends GameCreator {
        /**
         * @override
         */
        createGame() {
            this.snake = this.createNewSnake();
            this.bait = Bait.createNewBait();
            this.bricks = this.createSurroundBricks();
        }

        /**
         * Phương thức tạo rắn cho level 2, ta cần dịch chuyển vị trí của rắn ra khỏi vị trí
         * các viên gạch
         * @returns {Snake}
         */
        createNewSnake() {
            this.snake = Snake.createNewSnake();
            const newCells = [...this.snake.cells];
            for(let newCell of newCells) {
                const oldPoint = newCell.point;
                const newPoint = new Point(oldPoint.x, oldPoint.y + 1);
                newCell.point = newPoint;
            }
            this.snake.cells = newCells;
            return this.snake;
        }

        /**
         * Phương thức dùng để tạo ra các viên gạch bao quanh map
         * Tạo bao quanh map cần tạo ra các brick có toạ độ: 
         * [(0, 0), (1, 0), ... , (9, 0)] -> Đây là viền trên
         * [(0, 0), (0, 1), ... , (0, 9)] -> Đây là viền trái
         * [(0, 9), (1, 9), ..., (9, 9)] -> Đây là viền dưới
         * [(9, 0), (9, 1), ... , (9, 9)] -> Đâu là viền phải
         * Trừ đi 4 viên bị trùng là (0, 0) (9, 0) (0, 9) (9, 9) đi
         * 
         * @returns {Array<Brick>} mảng chứa các đối tượng brick được khởi tạo
         */
        createSurroundBricks() {
            let result = [];
            // Tạo viền trên
            for(let i = 0; i < COLUMN; i++) {
                const point = new Point(i, 0)
                const brick = new Brick(point);
                result.push(brick);
            }
            // Tạo viền trái, chạy từ 1 -> loại bỏ điểm (0, 0)
            for(let i = 1; i < ROW; i++) {
                const point = new Point(0, i);
                const brick = new Brick(point);
                result.push(brick);
            }

            // Tạo viền dưới, chạy từ 1 -> loại bỏ điểm (0, 9)
            for(let i = 1; i < COLUMN; i++) {
                const point = new Point(i, COLUMN - 1);
                const brick = new Brick(point);
                result.push(brick);
            }

            // Tạo viền phải, chạy từ 1 -> 8, loại bỏ được điểm (0, 9) và (9, 9)
            for(let i = 1; i < ROW - 1; i++) {
                const point = new Point(ROW - 1, i);
                const brick = new Brick(point);
                result.push(brick);
            }
            return result;
        }
    }

    /**
     * Lớp chịu trách nhiệm điều khiển chung trong trò chơi, đồng thời điểu khiển các thành phần khác
     * trong quá trình chơi
     */
    class Game {
        /**
         * Constructor truyền vào đối tượng game creator, tuỳ vào level người chơi chọn sẽ
         * khởi tạo ra các đối tượng phù hợp
         * @param {GameCreator} gameCreator 
         */
        constructor(gameCreator) {
            this.width = CANVAS_WIDTH;
            this.height = CANVAS_HEIGHT;
            this.gameCreator = gameCreator;
            this.isGameOver = false;
            gameCreator.createGame();

            this.snake = gameCreator.getSnake();
            this.bait = gameCreator.getBait();
            this.bricks = gameCreator.getBricks();
            this.direction = Direction.getInstance();
            this.imageBitmapHolder = ImageBitmapHolder.getInstance();
            this.turnPointHolder = TurnPointHolder.getInstance();
        }

        /**
         * @param {HTMLCanvasElement} canvas 
         * Phương thức nhận vào một canvas element, sau đó lần lượt vẽ rắn, mồi trên phần tử canvas đó
         */
        drawComponents() {
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // // Test vẽ hình game over
            // const point = new Point(0, 0);
            // const spriteItem = new SpriteItem(point, Sprites.GAME_OVER);
            // const imageBitmap = this.imageBitmapHolder.getBitmap(spriteItem.sprite);
            // // context.drawImage(imageBitmap, 0, 0);
            // context.drawImage(imageBitmap, spriteItem.point.x, spriteItem.point.y);

            // Vẽ gạch
            this.drawSpriteItems(this.bricks);

            // Vẽ mồi
            this.drawSpriteItems(this.bait);

            // Vẽ rắn
            this.drawSpriteItems(this.snake.cells);


        }

        /**
         * Phương thức dùng để draw một đối tượng SpriteItem
         * @param {SpriteItem} item 
         */
        draw(item, isFullCanvas) {
            const point = item.point;
            const imageBitmap = this.imageBitmapHolder.getBitmap(item.sprite);
            const context = canvas.getContext('2d');
            if(isFullCanvas) {
                context.drawImage(imageBitmap, point.x, point.y);
            }
            else {
                context.drawImage(imageBitmap, point.x * SPRITE_WIDTH, point.y * SPRITE_HEIGHT, SPRITE_WIDTH, SPRITE_HEIGHT)
            }
        }

        /**
         * Phương thức dùng để vẽ các sprite item, nhận vào một mảng chứa các đối tượng SpriteItem
         * lên canvas và có giới hạn width height
         * bằng với hằng số SPRITE_WIDTH và SPRITE_HEIGHT
         * @param {Array<SpriteItem>|SpriteItem} items Mảng chứa các sprite item
         */
        drawSpriteItems(items) {
            if(Array.isArray(items)) {
                items.forEach(item => {
                    this.draw(item, false);
                });
            } else this.draw(items, false);
        }

        /**
         * Phương thức nhận vào một mảng các sprite item
         * Sau đó vẽ item đó lên với toạ độ cho trước và có width height bằng với
         * hằng số CANVAS_WIDTH, CANVAS_HEIGHT
         * @param {Array<SpriteItem>|SpriteItem} items 
         */
        drawSpriteItemsFull(items) {
            this.draw(items, true);
        }

        clearCanvas() {
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        gameOver() {
            this.clearCanvas();
            const spriteItem = new SpriteItem(new Point(0, 0), Sprites.GAME_OVER)
            this.drawSpriteItemsFull(spriteItem);
            this.isGameOver = true;
        }

        update() {
            let intervalId = setInterval(() => {
                moveCounter++;
                if (moveCounter >= (60 / MOVE_INTERVAL)) {
                    this.snake.move(this.direction.currentDirection);
                    // Xử lý đầu rắn va chạm với mồi
                    Collision.check([this.snake.cells[0]], [this.bait], () => {
                        this.snake.grow();

                        const baitX = Util.randomNumber(COLUMN);
                        const baitY = Util.randomNumber(ROW);
                        const newBaitPoint = new Point(baitX, baitY);
                        this.bait.point = newBaitPoint;
                    });

                    // Xử lý đầu rắn va chạm với body thì kết thúc game
                    const snakeBody = this.snake.cells.filter((cell, index) => index > 0);
                    Collision.check([this.snake.cells[0]], snakeBody, () => {
                        this.gameOver();
                        clearInterval(intervalId);
                    });

                    // Xử lý đầu rắn va chạm với các viên gạch thì kết thúc game
                    Collision.check([this.snake.cells[0]], this.bricks, () => {
                        this.gameOver();
                        clearInterval(intervalId);
                    });

                    moveCounter = 0;
                }

                if(!this.isGameOver)
                    this.drawComponents();
            }, INTERVAL);
        }
        controlListener() {
            const _this = this;
            $(document).on('keyup', function (e) {

                /**
                 * Phương thức dùng để tạo một đối tượng TurnPointItem mới khi người dùng
                 * rẽ hướng, sau đó lưu vào trong TurnPointHolder
                 */
                const storeNewTurnPointItem = () => {
                    const turnPoint = _this.snake.cells[0].point;
                    const turnSprite = Util.mapDirectionToTurnSprite(_this.direction);
                    const turnPointItem = new TurnPointItem(turnPoint, turnSprite);
                    _this.turnPointHolder.store(turnPointItem);
                }

                switch (e.key) {
                    case 'ArrowRight':
                        _this.direction.setDirection(Direction.RIGHT);
                        _this.snake.cells[0].sprite = Util.mapDirectionToTurnSprite(_this.direction);
                        storeNewTurnPointItem();
                        break;
                    case 'ArrowDown':
                        _this.direction.setDirection(Direction.DOWN);
                        _this.snake.cells[0].sprite = Util.mapDirectionToTurnSprite(_this.direction);
                        storeNewTurnPointItem();
                        break;
                    case 'ArrowLeft':
                        _this.direction.setDirection(Direction.LEFT);
                        _this.snake.cells[0].sprite = Util.mapDirectionToTurnSprite(_this.direction);
                        storeNewTurnPointItem();
                        break;
                    case 'ArrowUp':
                        _this.direction.setDirection(Direction.UP);
                        _this.snake.cells[0].sprite = Util.mapDirectionToTurnSprite(_this.direction);
                        storeNewTurnPointItem();
                        break;
                    default:
                        break;
                }
            });
        }

        start() {
            this.controlListener();
            this.update();
        }
    }

    new Game(new SecondLevelCreator()).start();
});