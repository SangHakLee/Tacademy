var express = require('express');
var router = express.Router();
var mysql = require('mysql'); //mysql 선언
var pool = mysql.createPool({ // pool 만들기
	connectionLimit : 150, //최대 연결 수
	host : 'localhost',
	user : 'root',
	password : '1234',
	database : 'test'
});

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

// /write
router.get('/write', function(req, res){
	res.render('writeform', {title: '글쓰기'}); // render가 보내주는 것
})

// /write method="POST"
router.post('/write', function(req, res){
	console.log('req.body=', req.body); // req.body로 해서 body의 부분이 잘 넘어오나 확인
	var name = req.body.name; //웹상 정보 가져오기 db에 넣기 위해서
	var pw = req.body.pw;
	var title = req.body.title;
	var content = req.body.content;
	/*
	// null 값 때문에 서버 죽는것 방지 유효성 검사
		//console.log('content', content);
	if(name==undefined){ // name이 null이면
		res.json({'err' : 'no name'}); // err 메세지 남기고
		return; // 그냥 종료
	}
	if(pw==undefined){
		res.json({'err' : 'no pw'});
		return;
	}
	if(title==undefined){
		res.json({'err' : 'no title'});
		return;
	}
	if(content==undefined){
		res.json({'err' : 'no content'});
		return;
	}
	*/
	var arr = [pw, name, title, content]; // 정보를 배열에 넣어 준다

	//DB 연결 후 insert
	pool.getConnection(function(err, conn){
		if(err) console.error('err', err);
		//console.log('conn', conn);
		var sql = 'insert into board(pw, name, title, content, regdate, hit, good) values(?,?,?,?,now(),0,0)';
		conn.query(sql, arr, function(err,row){
			if(err) console.error('err', err);
			console.log('row', row);
			if(row.affectedRows === 1){ // 1이면 저장이 된것
				//res.json({'success':'ok!!'});
				res.redirect('/list/1'); //글쓰기 성공하면 1페이지로
			}else{
				res.json({'success':'fail'});
			}
			//res.json({'success':'ok!!'}); // 서버측에서 클라이언트로 응답을 보내줌
			conn.release(); // 꼭 해줘야 함
		});
	});
});

// /list
router.get('/list', function(req, res){

	// /list로 호출이 오면 /list/1로 리다이렉트 하겠다.(주소 변경 )
	res.redirect('/list/1');

	/* //paging 부분으로 바뀜
	pool.getConnection(function(err, conn){
		if(err) console.error('err', err);

		// 날짜가 너무 길기 때문엔 변환		DATE_FORMAT(regdate,'%Y-%m-%d %H:%i:%s') regdate
		conn.query("select num, name, title, DATE_FORMAT(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit from board order by num desc", [], function(err,rows){ // 받아오는게 없어서 [] rows에 담는다 배열로 []
			if(err) console.error('err', err);
			console.log('rows', rows);
			var datas = {title : '리스트', data: rows}; //코드가 길어져서 변수로 rows를 data라는 키로
			res.render('list', datas); // datas를 던진다
			conn.release(); // 꼭 해줘야 함
		});
	});
	*/
});

// /list paging
router.get('/list/:page', function(req, res){
	var page = req.params.page; // 넘어오는 값이 문자이기 때문에 숫자로 바꿔야함
	page = parseInt(page, 10); // 숫자로 변경
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
				res.render('list', datas); // datas를 던진다 이 datas의 data는 ejs에서 변수로 사용된다.
				conn.release(); // 꼭 해줘야 함
			});
			//res.send('startPage :' + startPage +',endPage :' + endPage); //응답을 위한 무의미 데이터
		});
	});
	/*pool.getConnection(function(err, conn){
		if(err) console.error('err', err);

		// 날짜가 너무 길기 때문엔 변환		DATE_FORMAT(regdate,'%Y-%m-%d %H:%i:%s') regdate
		conn.query("select num, name, title, DATE_FORMAT(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit from board order by num desc", [], function(err,rows){ // 받아오는게 없어서 [] rows에 담는다 배열로 []
			if(err) console.error('err', err);
			console.log('rows', rows);
			var datas = {title : '리스트', data: rows}; //코드가 길어져서 변수로 rows를 data라는 키로
			res.render('list', datas); // datas를 던진다
			conn.release(); // 꼭 해줘야 함
		});
	});*/

});

//300개 글쓰기
router.get('/write300', function(req, res){
	pool.getConnection(function(err, conn){
		if(err) console.error('err', err);

		for(var i = 0; i <= 300; i++){
			var pw = '1234';
			var name = '타잔' + i;
			var title = i + '원짜리';
			var content = i + '뭐야 이게';
			conn.query('insert into board(pw, name, title, content, regdate, hit, good) values(?,?,?,?,now(),0,0)',[pw, name, title, content], function(err, row){
				if(err) console.error('err', err);
			});
		}
		res.send('<script>alert("300개의 글 저장 완료!!!");</script>');
		conn.release();
	});
});

module.exports = router;
