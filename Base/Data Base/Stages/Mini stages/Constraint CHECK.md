\- принуждает использовать только значения, которые удовлетворяют его условиям. Например может сделать так, чтобы столбец мог принимать значения от 1 до 6.

Пример:
```sql
create table STUDENTS
(
    ID         number,
    NAME       varchar2(15),
    COURSE     number constraint ch CHECK ( COURSE > 0 and COURSE < 6 ),
    FACULTY_ID integer,
    constraint ch2 check ( FACULTY_ID < 10 )
);

alter table student modify (id constraint ch CHECK (id>=1));
alter table student add constraint ch2 CHECK (course<20);
alter table student add CHECK (course<20);

```