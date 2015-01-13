//db_board.js

// db 모델의 정보이기 때문에 mysql에 대한 설정파일 선언한다.
var mysql = require('mysql'); //mysql 선언
var pool = mysql.createPool({ // pool 만들기
	connectionLimit : 150, //최대 연결 수
	host : 'localhost',
	user : 'root',
	password : '1234',
	database : 'test'
});

exports.write = function(datas, callback){ // data는 넘어오는 것, 성공하면 callback 을 호출한다.
	pool.getConnection(function(err, conn){
		if(err) console.error('err', err);
		//console.log('conn', conn);
		var sql = 'insert into board(pw, name, title, content, regdate, hit, good) values(?,?,?,?,now(),0,0)';
		conn.query(sql, datas, function(err,row){
			if(err) console.error('err', err);
			console.log('row', row);
			if(row.affectedRows === 1){ // 1이면 저장이 된것
				success = true; // 여기는 db 단이라서 redirect 하지 않고 콜백(success)을 넘긴다.
			}
			//res.json({'success':'ok!!'}); // 서버측에서 클라이언트로 응답을 보내줌
			conn.release(); // 꼭 해줘야 함
			callback(success); // 성공하면 callback으로 success 호출됨 즉 callback이 들어온 곳으로 값을 보낸다.
		});
	});
};

exports.list = function(page, callback){
	var size = 10; // 한 페이지에 보여줄 글 갯수
	var begin =(page-1)*size // 시작 글번호 mysql은 인덱스가 0부터 시작

	pool.getConnection(function(err, conn){
		if(err) console.error('err', err);
		conn.query('select count(*) cnt from board', [], function(err, rows){
			if(err) console.error('err', err);
			//console.log('rows', rows);
			var cnt = rows[0].cnt; // rows에 들어가는 데이터는 한개이기 때문에 0번째
			var totalPage = Math.ceil(cnt / size); // 총 글수 나누기 한페이지당 글 결과를 올림
			var pageSize = 10; // 글 밑에 네이게이션 링크를 10개로 하겠다.
			var startPage = Math.floor((page-1)/pageSize) * pageSize +1 ; //네이게이션 링크의 첫 시작 숫자
			var endPage = startPage+(pageSize-1); //네이게이션 링크의 마지막 시작 숫자
			if(endPage > totalPage){ // 만약 글이 17개 밖에 없는 경우 endPage는 20이 아니라
				endPage = totalPage; // 17이 된다.
			}
			var max = cnt - ( (page-1)*size); // 전체 글 갯수
			// 날짜가 너무 길기 때문엔 변환		DATE_FORMAT(regdate,'%Y-%m-%d %H:%i:%s') regdate
			conn.query("select num, name, title, DATE_FORMAT(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit from board order by num desc limit ?,?", [begin, size], function(err,rows){ // 받아오는게 없어서 [] rows에 담는다 배열로 []
				// limit ?,?", [begin, size] => limit를 사용해서 begin 부터 size 까지 얻는다.
				if(err) console.error('err', err);
				console.log('rows', rows);
				var datas = { // list.ejs에서 사용하기 위해 넘겨준다.
					title : '리스트',
					data : rows,
					page :page,
					pageSize: pageSize,
					startPage : startPage,
					endPage : endPage,
					totalPage : totalPage,
					max : max
				}; //코드가 길어져서 변수로 rows를 data라는 키로
				//res.render('list', datas); // 더이상 여기서 render 하지 않는다.
				conn.release(); // 꼭 해줘야 함
				callback(datas); // callback으로 결과 넘겨줌
			});
			//res.send('startPage :' + startPage +',endPage :' + endPage); //응답을 위한 무의미 데이터
		});
	});
};

exports.read = function(num, callback){
	pool.getConnection(function(err,conn){
		if(err) console.error('err', err);
		conn.query('update board set hit=hit+1 where num=?', [num], function(err, rows){ // 조회수 증가
			if(err) console.error('err', err);
			conn.query('select * from board where num=?', [num], function(err, rows){ // 글 읽기
				if(err) console.error('err', err);
				console.log('rows', rows); // 로그  찍어보기
				//res.render('read', {title:'글 읽기', data:rows[0], page:page}); // render 여기서 안한다..
				conn.release();
				callback(rows[0]); // 모든 작업을 마치고 callback으로 index.js로 돌아간다.
			});
		});
	});
};

exports.updateform = function(num, callback){
	pool.getConnection(function(err, conn){
		if(err) console.error('err', err);
		conn.query('select * from board where num=?', [num], function(err, rows){
			//body
			//res.render('updateform', {title:'글 수정', data:rows[0], page:page});
			conn.release
			callback(rows[0]); // 모든 작업을 마치고 callback으로 index.js로 돌아간다.
		});
	});
};

exports.update = function(datas, callback){
	pool.getConnection(function(err,conn){
		if(err) console.error('err', err);
		conn.query('update board set name=?, title=?, content=? where num=? and pw=?', datas, function(err, row){
			if(err) console.error('err', err);
			var success = false;
			if(row.affectedRows ==1){ // 성공한 경우
				success = true; // 여기서 rendering 하면 안된다.
			}
			conn.release();
			callback(success);
		});
	});
};

exports.delete = function(datas, callback){
	pool.getConnection(function(err, conn){
		if(err) console.error('err', err);
		conn.query('delete from board where num=? and pw=?', datas, function(err, row){ // 여기서 가져온 num과 pw가 같으면 삭제
			if(err) console.error('err', err);
			var success = false;
			if(row.affectedRows ==1){ // 성공한 경우
				success = true;
			}
			conn.release();
			callback(success);
		});
	});
}