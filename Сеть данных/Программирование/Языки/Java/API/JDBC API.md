# Java Database Connectivity
*необходимо знать:* [[$ SQL base]], [[Java Base]]
*теги:* #java #sql #базы_данных 
*описание:* DBC — это интерфейс, который позволяет программе Java подключаться к базе данных и выдавать операторы DML и DDL.
*link:* https://javarush.ru/groups/posts/2172-jdbc-ili-s-chego-vsje-nachinaetsja, https://www.youtube.com/watch?v=Y2sRuCUpJ78, 

---
## Подключение к базам данных
(https://oracle-patches.com/coding/3042-java-подключение-к-базам-данных-oracle)

Oracle предоставляет четыре основных вида драйверов JDBC:
- ==Тонкий драйвер JDBC==. Этот простейший клиентский драйвер Java предоставляет прямое соединение с базой данных посредством протокола TCP/IP. Этот драйвер требует наличия слушателя и использует сокеты для установления соединений базами данных.
- ==OCI-драйвер JDBC==. Этот драйвер требует наличия клиентской инсталляции Oracle, поэтому он является специфичным для Oracle. Этот драйвер в высшей степени масштабируем, и он может использовать пул соединений для обслуживания большого количества пользователей.
- ==Тонкий драйвер серверной стороны== JDBC. Действуя на сервере, этот драйвер подключается к удаленным базам данных и предоставляет те же функциональные возможности, что и тонкий драйвер клиентской стороны.
- ==Внутренний драйвер серверной стороны JDBC==. Как видно из его названия, этот драйвер располагается на сервере и используется виртуальной машиной Java Virtual Machine (Virtual Machine Java — JVM) для обмена данными с сервером базы данных Oracle.

После выбора конкретного типа драйвера JDBC необходимо указать драйвер JDBC одним из двух способов: используя статический метод `registerDriver()` класса `DriverManager` JDBC или применяя метод `forName()` класса java.lang. 
Эти два метода указания драйвера JDBC имеют следующий вид: 
```java
DriverManager.registerDriver ("new oracle.jdbc.OracleDriver()");
```
и
```java
Class.forName("oracle.jdbc.driver.OracleDriver") 
```

Как только драйвер JDBC загружен, с помощью статического метода `getConnection()` класса `DriverManager` можно установить соединение с базой данных. Этот метод создаст экземпляр класса connection JDBC. Соответствующий код приведен в листинге ниже.
```java
connection conn=DriverManager.getConnection("jdbc:oracle:thin:@prod1:1521:finprod", username, passwd);
   /* Различные части объекта соединения означают следующее: 
   jdbc=protocol
   oracle=vendor
   thin=driver
   prod1=server
   1521=port number
   finprod=Oracle database
   username=database username
   password=database password
   */
```

## Работа с БД из Java
Теперь, когда вы научились подключаться к базе данных, используя интерфейс JDBC, пора выяснить, как посредством JDBC-соединения можно обрабатывать операторы SQL в базе данных.

### Создание объекта Statement
Чтобы передать SQL-операторы базе данных, необходимо создать JDBC-объект Statement. Этот объект свяжет себя с открытым соединением, и в дальнейшем будет действовать в качестве канала, по которому SQL-операторы будут передаваться из программы Java в базу данных для выполнения. Объект Statement JDBC создается следующим образом: 
```java
Statement stmt = conn.createStatement();
```

С объектом stmt никакие SQL-операторы не связаны. Однако класс Statement содержит еще один объект, названный PreparedStatement, который, кроме того, что служит каналом для выполнения операторов, всегда содержит SQL-оператор. Этот SQL- оператор компилируется немедленно, причем он может компилироваться только один раз, а затем использоваться многократно, что является огромным преимуществом.

### Выполнение SQL-операторов
Чтобы понять работу SQL-операторов JDBC, следует отделить операторы SELECT, выполняющие запросы к базе данных, от всех остальных операторов. В отличие от других операторов, операторы SELECT не изменяют состояние базы данных.

#### Обработка select-запросов
Для получения результатов запроса операторы SELECT используют метод execute- Query(). Этот метод возвращает результаты в объекте ResultSet. Пример приведен в листинге ниже.
```java
string first_name,last_name,manager;
number salary;
resultSet rs = stmt.executeQuery("SELECT * FROM Employees");
while (rs.next()) {
   first_name = rs.getString("first_name");
   last_name = rs.getString("last_name");
   manager = rs.getString("manager");
   salary = rs.getNumber("salary");
   system.out.println(first_name + last_name "works for" Manager "salary is:" salary.");
```

#### Запросы, изменяющие БД
Любой оператор, который изменяет состояние базы данных — будь то оператор DDL или оператор DML, такой как INSERT, UPDATE либо DELETE — выполняется с помощью метода executeUpdate(). Обратите внимание, что слово “update” (“обновление”) в имени метода указывает, что SQL-оператор будет изменять что-либо в базе данных.

Вот несколько примеров операторов executeUpdate():
```java
statement stmt = conn.createStatement();
stmt.executeUpdate("CREATE TABLE Employees" +
                   "(last_name VARCHAR2(30), first_name VARCHAR2(20),
                     manager VARCHAR2(30), salary(number");
stmt.executeUpdate("INSERT INTO Employees " +
                   "VALUES ('Alapati', 'Valerie', 'Shannon', salary)");
```

При использовании интерфейса для выполнения SQL-операторов все обычные свойства SQL-транзакций, такие как целостность и продолжительность, сохраняются. По умолчанию каждый оператор утверждается после его выполнения, поскольку, как видно из следующего примера, значение **conn.setAutoCommit()** установлено равным true. Утверждение после выполнения каждого оператора можно гарантировать любым из следующих способов (при желании можно применить метод ==conn.rollback()==, чтобы выполнить откат оператора): 
```java
conn.setAutoCommit(false);

//or
conn.commit()
```

