# Java Servlets
*необходимо знать:* [[JBoss]]
*теги:* #java #net 
*описание:* 
*link:* https://www.youtube.com/watch?v=U3YS-U_N3vo

---
==Java Servlets== - это технология, которая позволяет принимать и обрабатывать сетевые запросы, без программирования серверной инфраструктуры. В большинстве случаев используется HTTP ([[HHTP]])

==Сервлет== - это класс в составе веб-приложения, который является наследником класса Servlen(или HttpServlet) и соответствующим образом зарегистрирован. Зарегистрировать сервлет можно в файле ресурсов web.xml или с помощью аннотации @WebServlet.
	Кроме сервлетов есть похожие на них фильтры, которые имеют те же функции, но могут передавать полученный запрос по цепочке другим фильтрам.
	
## Создание Сервлета на java
1. Создаем класс и наследуем его от HttpServlet.
2. Регистрируем сервлет через аннотацию @WebServlet и в параметрах к аннотации в круглых скобках указываем urlPattens = куску url, который добавляется к общему url нашего приложения:
	```java
	@WebServlet(urlPatterns = "/hello")
	
	```
3. Переопределяем метод 
```java
protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
         resp.getWriter().append("Hello, world! It's my respond\n" + req.getMethod());
    }
``` 
4. Собираем проект, и запускаем его в браузере. Например так: `http://localhost:8080/myweb-1.0-SNAPSHOT/hello`.

## Сессии
Протокол HTTP не сохраняет состояния. Чтобы понять, что разные запросы приходят от одного пользователя, существует механизм сессий.

==Сессия== - это хранилище данных, которое сопоставлено с конкретным клиентом (браузером). Доступ к данным сессии можно получить с помощью класса HttpSession, экземпляр которого можно получить из экземпляра запроса. При этом механизм сессии использует cookies [[$- Cookie]] на стороне браузера, чтобы сопоставить пользователя с привязанными к нему данными.

Чтобы сделать сессии, переделайте метод следующим образом:
```java
@Override
protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
	 resp.getWriter().append("Hello, world! It's my respond\n" + req.getMethod());
	 HttpSession session = req.getSession();

	 if (session.getValue("name") == null) {
		session.putValue("name", "Hello world session");
		resp.getWriter().append(" No session");
	 } else {
		 resp.getWriter().append((String) session.getValue("name"));
	 }
}
```