$(document).ready(function() {
    
    const WIDTH = 30;
    const HEIGHT = 30;
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
    class Cell {
        /**
         * @param {Point} point Toạ độ của tế bào
         * @param {string} sprite hình ảnh hiển thị của tế bào
         */
        constructor(point, sprite) {
            this.point = point;
            this.sprite = sprite;
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
    }

    /**
     * Lớp dùng để biểu diễn mồi trong game
     */
    class Bait {
        /**
         * @param {Point} point toạ độ của mồi
         */
        constructor(point) {
            this.point = point;
            this.sprite = Sprites.APPLE;
        }
    }

    /**
     * Lớp chịu trách nhiệm điều khiển chung trong trò chơi, đồng thời điểu khiển các thành phần khác
     * trong quá trình chơi
     */
    class Game {
        constructor() {
            this.width = WIDTH;
            this.height = HEIGHT;
        }

        /**
         * @param {HTMLCanvasElement} canvas 
         * Phương thức nhận vào một canvas element, sau đó lần lượt vẽ rắn, mồi trên phần tử canvas đó
         */
        async drawComponents(canvas) {
            
        }
    }
});