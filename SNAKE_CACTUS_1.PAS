
Program f1;

Uses 
crt,
GRAPH;

Const 
  maxSnakeLength = 100;
  head = 1;
  N = 50;
  frameColor = 15; { white }

Type 
  Direction = (left, right, up, down);
  DrawMode = (hide, show);
  SnakeRole = (my, computer);

  LogicalPoint = Record
    x: byte;
    y: byte;
  End;

  GraphPoint = Record
    x: integer;
    y: integer;
  End;

  SnakeHead = LogicalPoint;

  SnakeType = Record
    bodyLength: integer;
    body: Array [1..maxSnakeLength] Of LogicalPoint;
    snakeColor: byte;
    appleCount: byte;
    role: SnakeRole;
  End;

Var 
  apple: LogicalPoint;
  FutureHeadPos: SnakeHead;
  cellWidth: integer;
  frameOrigin: GraphPoint;

Procedure DrawAppleCount(snake: SnakeType);

Var S1, S2 : string;
Begin

  If snake.role = my Then
    Begin
      SetColor(Green);
      SetTextStyle(1, 0, 2);
      OutTextXY(frameOrigin.x, 5, 'Your apples:');
      SetColor(0);
      SetFillStyle(1, 0);
      Bar(frameOrigin.x + 160, 5, frameOrigin.x + 180, 5 + 30);
      Str (snake.appleCount, S1);
      SetColor(Green);
      OutTextXY(frameOrigin.x + 160, 5, S1);
    End

  Else If snake.role = computer Then
         Begin

           SetColor(Red);
           SetTextStyle(1, 0, 2);
           OutTextXY(frameOrigin.x + 400, 5, 'Apples of opponent:');
           SetColor(0);
           SetFillStyle(1, 0);
           Bar(frameOrigin.x + 630, 5, frameOrigin.x + 650, 5 + 30);
           Str (snake.appleCount, S2);
           SetColor(Red);
           OutTextXY(frameOrigin.x + 630, 5, S2);

         End;
End;

Procedure DrawApple(mode: DrawMode);

Var gra_x, gra_y: integer;
  color: integer;
Begin
  If mode = hide Then
    color := 0
  Else If mode = show Then
         color := Red;

  gra_x := frameOrigin.x + (apple.x - 1) * cellWidth;
  gra_y := frameOrigin.y + (apple.y - 1) * cellWidth;
  SetColor(color);
  SetFillStyle(1, color);
  Bar(gra_x, gra_y, gra_x + cellWidth, gra_y + cellWidth);
End;

Procedure PutApple(snake, computerSnake: SnakeType);

Var posFound: Boolean;
  i: integer;
Begin
  randomize;
  Repeat
    apple.x := Random(N + 1);
    apple.y := Random(N + 1);

    If apple.x = 0 Then Inc(apple.x);
    If apple.y = 0 Then Inc(apple.y);

    posFound := True;



    For i := 1 To snake.bodyLength Do
      If ((snake.body[i].x = apple.x) And  (snake.body[i].y = apple.y))
         Or ((computerSnake.body[i].x = apple.x) And  (computerSnake.body[i].y =
         apple.y)) Then
        posFound := False;
    break;

  Until posFound;

  DrawApple(show);
  DrawAppleCount(snake);
  DrawAppleCount(computerSnake);

End;

Procedure GrowSnake(Var snake: SnakeType);
Begin
  If snake.bodyLength < maxSnakeLength Then
    Inc(snake.bodyLength);

    {snake.body[snake.bodyLength] := snake.body[snake.bodyLength - 1];}
End;


Procedure DrawFrame;

Const d = 3;
Begin
  SetColor(frameColor);
  Rectangle(frameOrigin.x - d, frameOrigin.y -d, frameOrigin.x + cellWidth * N +
            d,
            frameOrigin.y + cellWidth * N + d);
End;

Function EqualPoints(l,r : LogicalPoint) : Boolean;
Begin
  If (l.x = r.x) And (l.y = r.y) Then
    EqualPoints := True
  Else
    EqualPoints := False;
End;

Function LunchTime(snake: SnakeType): Boolean;
Begin
  If EqualPoints(snake.body[head], apple) Then
    LunchTime := True
  Else
    LunchTime := False;
End;

Procedure EatApple(Var snake: SnakeType);
Begin
  DrawApple(hide);
  GrowSnake(snake);
  Inc (snake.appleCount);
End;


Procedure PointToGraphPoint(lp : LogicalPoint; Var gp : GraphPoint);
Begin
  gp.x := frameOrigin.x + (lp.x - 1) * cellWidth;
  gp.y := frameOrigin.y + (lp.y - 1) * cellWidth;
End;

Procedure DrawSnake(snake: SnakeType; mode: DrawMode);

Var 
  gp : GraphPoint;
  i : integer;
  color : integer;
Begin
  If mode = hide Then
    color := 0
  Else If mode = show Then
         color := snake.snakeColor;

  SetColor(color);
  SetFillStyle(SolidFill, color);

  For i := head To snake.bodyLength Do
    Begin
      PointToGraphPoint(snake.body[i], gp);
      Bar(gp.x, gp.y, gp.x + cellWidth, gp.y + cellWidth);
    End;
End;


Function MoveSnake(d: Direction; Var snake: SnakeType) : Boolean;

Var i: integer;
  canMove: boolean;
Begin
  canMove := True;
  DrawSnake(snake, hide);

  For i := snake.bodyLength Downto 2 Do
    snake.body[i] := snake.body[i - 1];

  Case d Of 
    up: Dec(snake.body[head].y);
    down: Inc(snake.body[head].y);
    left: Dec(snake.body[head].x);
    right: Inc(snake.body[head].x);
  End;

  If snake.body[head].y > N Then canMove := False;
  If snake.body[head].y < 1 Then canMove := False;
  If snake.body[head].x > N Then canMove := False;
  If snake.body[head].x < 1 Then canMove := False;

  For i := 2 To snake.bodyLength Do
    If EqualPoints (snake.body[head], snake.body[i]) Then
      Begin
        canMove := False;
        Break;
      End;

  If Not canMove Then
    Begin
      For i := 1 To snake.bodyLength - 1 Do
        snake.body[i] := snake.body[i + 1];
    End;

  DrawSnake(snake, show);

  MoveSnake := canMove;

  writeln(d,' ', canMove,' ', snake.bodyLength);
End;

Function RandomDirection(d: Direction): Direction;

Var randomD: byte;
  newDirection: Direction;

Begin
  randomD := Random(4);
  Case randomD Of 
    0: newDirection := left;
    1: newDirection := right;
    2: newDirection := up;
    3: newDirection := down;
  End;

  If ((d = right) And (
     newDirection = left)) Or
     ((d = left)  And (
     newDirection = right)) Or
     ((d = up)    And (
     newDirection = down)) Or
     ((d = down)  And (
     newDirection = up)) Then
    RandomDirection := d
  Else
    RandomDirection := newDirection;
End;

Procedure GoToApple_X(snake: SnakeType; Var d: Direction);
Begin
  If apple.x > snake.body[head].x Then
    d := right
  Else If apple.x < snake.body[head].x Then
         d := left
  Else If apple.x = snake.body[head].x Then
  ;

End;

Procedure GoToApple_Y(snake: SnakeType; Var d: Direction);
Begin
  If apple.y > snake.body[head].y Then
    d := down
  Else If apple.y < snake.body[head].y Then
         d := up
  Else If apple.y = snake.body[head].y Then
  ;

End;


Procedure GameOver;
Begin
  SetColor(Red);
  SetTextStyle(1, 0, 4);
  OutTextXY(frameOrigin.x, frameOrigin.y + N * cellWidth + 5, 'GAME OVER');

  Repeat
    Delay(100);
  Until keypressed;

  Halt(1);
End;

Function EndOfGame: Boolean;
Begin
  EndOfGame := False;
End;

Function GetDirection(c: char;  d: Direction) : Direction;

Var 
  newDirection: Direction;
Begin
  newDirection := d;

    {get newDirection from c}

  Case c Of 
    #77: newDirection := right;
    #75: newDirection := left;
    #72: newDirection := up;
    #80: newDirection := down;
  End;

  If ((d = right) And (
     newDirection = left)) Or
     ((d = left)  And (
     newDirection = right)) Or
     ((d = up)    And (
     newDirection = down)) Or
     ((d = down)  And (
     newDirection = up)) Then
    GetDirection := d
  Else
    GetDirection := newDirection;
End;

Function SnakesClash(snake1, snake2: SnakeType) : Boolean;

Var i: integer;
Begin
  SnakesClash := False;

  For i := 1 To snake2.bodyLength Do
    If EqualPoints(snake1.body[head], snake2.body[i]) Then
      Begin
        SnakesClash := True;
        Break;
      End;
End;

Procedure Restart(Var snake: SnakeType);

Var i: integer;
Begin
  DrawSnake(snake, hide);
  snake.body[head].x := 2 + snake.bodyLength;
  snake.body[head].y := 2;

  For i := 2 To snake.bodyLength Do
    Begin
      snake.body[i].x := snake.body[i - 1].x - 1;
      snake.body[i].y := 2;
    End;

  DrawSnake(snake, show);
  delay(100);
  DrawSnake(snake, hide);
  delay(100);
  DrawSnake(snake, show);
  delay(100);
  DrawSnake(snake, hide);
  delay(100);
  DrawSnake(snake, show);
  delay(100);
  DrawSnake(snake, hide);
  delay(100);
End;

Procedure InitGame(Var snake, computerSnake: SnakeType; maxX, maxY: integer);

Var frameWidth : integer;
  fiveApple: byte;
Begin
  snake.bodyLength := 5;
  snake.body[1].x := 10;
  snake.body[1].y := 2;
  snake.body[2].x := 9;
  snake.body[2].y := 2;
  snake.body[3].x := 8;
  snake.body[3].y := 2;
  snake.body[4].x := 7;
  snake.body[4].y := 2;
  snake.body[5].x := 6;
  snake.body[5].y := 2;

  computerSnake.bodyLength := 5;
  computerSnake.body[1].x := 10;
  computerSnake.body[1].y := 30;
  computerSnake.body[2].x := 9;
  computerSnake.body[2].y := 30;
  computerSnake.body[3].x := 8;
  computerSnake.body[3].y := 30;
  computerSnake.body[4].x := 7;
  computerSnake.body[4].y := 30;
  computerSnake.body[5].x := 6;
  computerSnake.body[5].y := 30;

  cellWidth := round(maxY * 0.85) Div N;
  frameWidth := cellWidth * N;
  frameOrigin.x := (maxX - frameWidth) Div 2;
  frameOrigin.y := (maxY - frameWidth) Div 2;

  snake.appleCount := 0;
  computerSnake.appleCount := 0;

  snake.role := my;
  computerSnake.role := computer;

  snake.snakeColor := 2; { green }
  computerSnake.snakeColor := 4; { red }

  DrawFrame;
  {For fiveApple := 1 To 5 Do}
  PutApple(snake, computerSnake);
  DrawSnake(snake, show);
  DrawSnake(computerSnake, show);
End;



Var 
  DriverVar, ModeVar: integer;

  d, d2: Direction;
  c: char;
  R: integer;
  maxX, maxY, medX, medY:
                          integer;
  snake, computerSnake: SnakeType;
  moveNumber: longint;

Begin
  DriverVar := Detect;
  InitGraph(DriverVar,
            ModeVar, 'C:\TPWDB\BGI');
  maxX := GetMaxX;
  maxY := GetMaxY;
  medX := maxX Div 2;
  medY := maxY Div 2;

  InitGame(snake, computerSnake, maxX, maxY);
  Delay(3000);

  d := right;
  d2 := right;
  moveNumber := 0;

  {moveNumber := 0;}

  While Not EndOfGame Do
    Begin
      If LunchTime(snake) Then
        Begin
          EatApple(snake);
          PutApple(snake, computerSnake);
        End;

      If keypressed Then
        Begin
          Repeat
            c := readkey;
          Until Not keypressed;

          If c = #27 Then
            break;
          d := GetDirection(c, d);
        End;


      If LunchTime(computerSnake) Then
        Begin
          EatApple(computerSnake);
          PutApple(snake, computerSnake);
        End;

      If MoveSnake(d2, computerSnake) Then
        Begin
          If Not (computerSnake.body[head].x = apple.x) Then
            GoToApple_X(computerSnake, d2)
          Else If Not (computerSnake.body[head].y = apple.y) Then
                 GoToApple_Y(computerSnake, d2);
        End

      Else Repeat
             d2 := RandomDirection(d2)
        Until (MoveSnake(d2, computerSnake));


{Inc(moveNumber);
      If (moveNumber Mod 5 = 0) Or (Not MoveSnake(d2, computerSnake)) Then
        Repeat
          d2 := RandomDirection(d2)
        Until (MoveSnake(d2, computerSnake));}

      Delay(100);
      If Not MoveSnake(d, snake) Then GameOver;
      If SnakesClash(snake, computerSnake) Then GameOver;
      If SnakesClash(computerSnake, snake) Then Restart(computerSnake);
    End;

End.
