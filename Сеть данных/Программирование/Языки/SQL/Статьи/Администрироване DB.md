# Администрироване DB
#TODO: переписать статью, чтобы она была про создание и подключение к БД.
*теги:* #database
*описание:* Подключение к дб, управление им, добавление баз данных.

---
## HR схема
==User== - лицо, которое может подключиться к БД (log on process). User имеет имя и пароль.

==DB схема== - это все объекты в БД, котороые принадлежат одному user-y. 

> Если мы обращаемся к чужым таблицам БД, нам необходимо писать имя user-а, затем точку и название таблицы 

Про объекты читайте здесь: [[Объекты Баз Данных]]

Пример вывода таблицы *regions* пользователя *hr*:
```sql
select * from hr.regions;
```
### Особые user-ы
При создании бд автоматически создаются юзеры sys и system

==SYS== юзер является владельцем служебных таблиц, которые не могут быть изменены. Иесли попробовать изменить эти таблицы, то структура всех бд может быть нарушено.

==SYSTEM== используется для мониторинга и администрации.



## Подключение к DB

### Октрытие БД для подключения:
Открываем терминал и вводим следующие команды
```sql
sqlplus / as sysdba
alter session set container = orclpdb2;
alter pluggable database open;
```

### Подключаемся через SQL plus:
1. Открываем косноль.
2. Вводим `sqlplus <name>/<password>@<ContainerDB>`
Например: 
```bash
sqlplus hr/hr@orclpdb2
```

### Подключение к MySQL
```bash
cd C:\Program Files\MySQL\MySQL Server 8.0\bin

-u root -p
root
```


![[Pasted image 20210309195736.png]]
user: denis
password: root

### Подключение к MySQL из java:
```java
public static void main(String\[\] args) throws ClassNotFoundException {  
   String userName = "root";  
 String password = "root";  
 String connectionUrl = "jdbc:mysql://localhost:3306/test";  
 Class.forName("com.mysql.cj.jdbc.Driver");  
 try(Connection conn = DriverManager.getConnection(connectionUrl, userName, password)) {  
      if (conn != null) {  
         System.out.println("Connection to the database!");  
 } else System.out.println("Failed to make connection!");  
  
 } catch (SQLException e) {  
      System.out.println("Ошибка подключения");  
 }  
}
```

## Подключиться как администратор
```bash
sqlplus sys/password@database_name as sysdba
```

Выдача прав на создание синоинмов:
```sql
grant create public synonym to hr;
```